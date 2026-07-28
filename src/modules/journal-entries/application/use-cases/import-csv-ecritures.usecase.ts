import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { PERIODE_LOCKS } from '../../../periode-locks/application/ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../../../periode-locks/application/ports/periode-locks.repository.interface';
import { JournalEntry } from '../../domain/entities/journal-entries.entity';
import { JournalLine, type CodeTva } from '../../domain/entities/journal-line.entity';

const VALID_TVA = new Set(['NORMAL_20', 'INTERMEDIAIRE_10', 'REDUIT_5_5', 'PARTICULIER_2_1', 'EXONERE', 'HORS_CHAMP']);

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ line: number; message: string }>;
}

type ParsedOk<T> = { ok: true; value: T };
type ParsedErr   = { ok: false; error: string };
type Parsed<T>   = ParsedOk<T> | ParsedErr;

function ok<T>(value: T): ParsedOk<T> { return { ok: true, value }; }
function err(error: string): ParsedErr { return { ok: false, error }; }

interface RawCsvRow {
  lineNumber: number;
  date: string;
  label: string;
  journalId: number | undefined;
  accountId: number;
  debit: number;
  credit: number;
  codeTva: CodeTva | undefined;
}

function parseQuotedField(raw: string, startAt: number): { value: string; nextIndex: number } {
  let val = '';
  let i = startAt + 1;
  while (i < raw.length) {
    if (raw[i] === '"' && raw[i + 1] === '"') { val += '"'; i += 2; }
    else if (raw[i] === '"')                   { i++; break; }
    else                                        { val += raw[i++]; }
  }
  return { value: val, nextIndex: i + 1 }; // +1 to skip comma
}

function parseCsvLine(raw: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= raw.length) {
    if (raw[i] === '"') {
      const { value, nextIndex } = parseQuotedField(raw, i);
      fields.push(value);
      i = nextIndex;
    } else {
      const end = raw.indexOf(',', i);
      if (end === -1) { fields.push(raw.slice(i).trim()); break; }
      fields.push(raw.slice(i, end).trim());
      i = end + 1;
    }
  }
  return fields;
}

function parseNonNegInt(raw: string | undefined, fieldName: string): Parsed<number> {
  if (!raw?.trim()) return err(`${fieldName} manquant.`);
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(n) || n < 0) return err(`${fieldName} invalide : "${raw}" (entier >= 0 en centimes).`);
  return ok(n);
}

function isCodeTva(val: string): val is CodeTva {
  return VALID_TVA.has(val);
}

function parseCodeTva(raw: string | undefined): Parsed<CodeTva | undefined> {
  if (!raw?.trim()) return ok(undefined);
  const up = raw.trim().toUpperCase();
  if (!isCodeTva(up)) return err(`codeTva invalide : "${raw}".`);
  return ok(up);
}

function parseJournalId(raw: string | undefined): Parsed<number | undefined> {
  if (!raw?.trim()) return ok(undefined);
  const j = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(j) || j <= 0) return err(`journalId invalide : "${raw}".`);
  return ok(j);
}

function buildHeaderIndex(header: string[]): { idx: Record<string, number>; error?: string } {
  const required = ['date', 'label', 'accountid', 'debit', 'credit'];
  for (const col of required) {
    if (!header.includes(col)) return { idx: {}, error: `Colonne manquante dans le CSV : "${col}"` };
  }
  return {
    idx: {
      date:      header.indexOf('date'),
      label:     header.indexOf('label'),
      journalId: header.indexOf('journalid'),
      accountId: header.indexOf('accountid'),
      debit:     header.indexOf('debit'),
      credit:    header.indexOf('credit'),
      codeTva:   header.indexOf('codetva'),
    },
  };
}

function parseRow(cols: string[], idx: Record<string, number>, lineNumber: number): Parsed<RawCsvRow> {
  const dateStr = cols[idx['date']]?.trim() ?? '';
  const label   = cols[idx['label']]?.trim() ?? '';
  if (!dateStr || !label) return err('Champs obligatoires manquants (date, label).');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || Number.isNaN(Date.parse(dateStr))) {
    return err(`Date invalide : "${dateStr}" (format attendu : YYYY-MM-DD).`);
  }

  const accountParsed = parseNonNegInt(cols[idx['accountId']], 'accountId');
  if (!accountParsed.ok) return accountParsed;
  if (accountParsed.value === 0) return err('accountId doit être > 0.');

  const debitParsed  = parseNonNegInt(cols[idx['debit']], 'debit');
  if (!debitParsed.ok) return debitParsed;
  const creditParsed = parseNonNegInt(cols[idx['credit']], 'credit');
  if (!creditParsed.ok) return creditParsed;

  const { value: debit } = debitParsed;
  const { value: credit } = creditParsed;
  if (debit === 0 && credit === 0) return err('Débit et crédit ne peuvent pas être tous les deux à 0.');
  if (debit > 0 && credit > 0) return err('Une ligne ne peut pas avoir simultanément un débit et un crédit.');

  const journalParsed = parseJournalId(idx['journalId'] >= 0 ? cols[idx['journalId']] : undefined);
  if (!journalParsed.ok) return journalParsed;
  const tvaParsed = parseCodeTva(idx['codeTva'] >= 0 ? cols[idx['codeTva']] : undefined);
  if (!tvaParsed.ok) return tvaParsed;

  return ok({
    lineNumber,
    date: dateStr,
    label,
    journalId: journalParsed.value,
    accountId: accountParsed.value,
    debit,
    credit,
    codeTva: tvaParsed.value,
  });
}

type GroupOutcome = { imported: true } | { imported: false; error: string };

@Injectable()
export class ImportCsvEcrituresUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
    @Inject(PERIODE_LOCKS)
    private readonly locks: PeriodeLocksRepository,
  ) {}

  async execute(csvBuffer: Buffer, userId: number): Promise<CsvImportResult> {
    const text  = csvBuffer.toString('utf-8').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('Le fichier CSV est vide ou ne contient pas de données.');
    }

    const header = parseCsvLine(lines[0].toLowerCase());
    const { idx, error: headerError } = buildHeaderIndex(header);
    if (headerError) throw new BadRequestException(headerError);

    const errors: CsvImportResult['errors'] = [];
    const rows: RawCsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const result = parseRow(parseCsvLine(lines[i]), idx, i + 1);
      if (result.ok) rows.push(result.value);
      else errors.push({ line: i + 1, message: result.error });
    }

    return this.importGroups(rows, userId, errors);
  }

  private async importGroups(
    rows: RawCsvRow[],
    userId: number,
    errors: CsvImportResult['errors'],
  ): Promise<CsvImportResult> {
    const groups = new Map<string, RawCsvRow[]>();
    for (const row of rows) {
      const key = `${row.date}||${row.label}||${row.journalId ?? ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    let imported = 0;
    let skipped  = 0;

    for (const groupRows of groups.values()) {
      const outcome: GroupOutcome = await this.importOneGroup(groupRows, userId);
      if (outcome.imported) {
        imported++;
      } else {
        skipped++;
        for (const r of groupRows) errors.push({ line: r.lineNumber, message: outcome.error });
      }
    }

    return { imported, skipped, errors };
  }

  private async importOneGroup(groupRows: RawCsvRow[], userId: number): Promise<GroupOutcome> {
    const first = groupRows[0];

    const totalDebit  = groupRows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = groupRows.reduce((s, r) => s + r.credit, 0);
    if (totalDebit !== totalCredit) {
      return { imported: false, error: `Écriture déséquilibrée "${first.label}" (débit ${totalDebit} ≠ crédit ${totalCredit}).` };
    }

    const date   = new Date(first.date);
    const locked = await this.locks.isLocked(date.getFullYear(), date.getMonth() + 1, userId);
    if (locked) {
      return { imported: false, error: `La période ${date.getMonth() + 1}/${date.getFullYear()} est verrouillée.` };
    }

    const lines = groupRows.map(r => new JournalLine(r.accountId, r.debit, r.credit, undefined, r.codeTva));
    await this.repo.createJournalEntry(new JournalEntry(date, first.label, lines), undefined, userId, first.journalId);
    return { imported: true };
  }
}
