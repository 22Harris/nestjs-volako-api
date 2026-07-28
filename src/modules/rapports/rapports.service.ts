import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as XLSX from 'xlsx';
import { PrismaService } from 'src/prisma/prisma.service';

export interface BilanPoste {
  code: string;
  name: string;
  solde: number; // centimes, toujours positif
}

export interface BilanReport {
  exercice: number;
  actif: {
    immobilisations: BilanPoste[];   // 2xx
    stocks: BilanPoste[];            // 3xx
    creances: BilanPoste[];          // 41x, 46x
    disponibilites: BilanPoste[];    // 5xx
    autresActif: BilanPoste[];
    total: number;
  };
  passif: {
    capitauxPropres: BilanPoste[];   // 1xx
    dettesFinancieres: BilanPoste[]; // 16x
    dettesFournisseurs: BilanPoste[]; // 401x
    autresDettes: BilanPoste[];
    total: number;
  };
  resultatExercice: number; // positif = bénéfice, négatif = perte
  equilibre: boolean;       // actif == passif + résultat
}

export interface CompteResultatPoste {
  code: string;
  name: string;
  montant: number; // centimes
}

export interface CompteResultatReport {
  exercice: number;
  charges: CompteResultatPoste[];
  produits: CompteResultatPoste[];
  totalCharges: number;
  totalProduits: number;
  resultat: number; // positif = bénéfice, négatif = perte
}

export interface FecLine {
  JournalCode: string;
  JournalLib: string;
  EcritureNum: string;
  EcritureDate: string;
  CompteNum: string;
  CompteLib: string;
  CompAuxNum: string;
  CompAuxLib: string;
  PieceRef: string;
  PieceDate: string;
  EcritureLib: string;
  Debit: string;
  Credit: string;
  EcritureLet: string;
  DateLet: string;
  ValidDate: string;
  Montantdevise: string;
  Idevise: string;
}

export interface BalanceLine {
  id: number;
  code: string;
  name: string;
  account_class: number;
  totalDebit: number;
  totalCredit: number;
}

export interface GrandLivreLigne {
  id: number;
  date: Date;
  label: string;
  pieceNumber: string | null;
  entryId: number;
  debit: number;
  credit: number;
  soldeCumul: number;
  lettre: string | null;
}

export interface GrandLivreResponse {
  account: { id: number; code: string; name: string; account_class: number };
  lines: GrandLivreLigne[];
  totalDebit: number;
  totalCredit: number;
  solde: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const BALANCE_CACHE_KEY = (userId: number) => `balance:${userId}`;
const GRAND_LIVRE_CACHE_KEY = (userId: number, accountId: number, dateFrom = '', dateTo = '', page = 1, pageSize = 50) =>
  `grand-livre:${userId}:${accountId}:${dateFrom}:${dateTo}:${page}:${pageSize}`;

@Injectable()
export class RapportsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getBalance(userId: number, page = 1, pageSize = 50): Promise<PaginatedResponse<BalanceLine>> {
    const cacheKey = BALANCE_CACHE_KEY(userId) + `:${page}:${pageSize}`;
    const cached = await this.cache.get<PaginatedResponse<BalanceLine>>(cacheKey);
    if (cached) return cached;

    const allAccounts = await this.prisma.account.findMany({
      where: { userId },
      include: { journalLines: true },
      orderBy: { code: 'asc' },
    });

    const allLines: BalanceLine[] = allAccounts.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      account_class: a.class,
      totalDebit: a.journalLines.reduce((s, l) => s + l.debit, 0),
      totalCredit: a.journalLines.reduce((s, l) => s + l.credit, 0),
    }));

    const total = allLines.length;
    const offset = (page - 1) * pageSize;
    const result: PaginatedResponse<BalanceLine> = {
      data: allLines.slice(offset, offset + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    await this.cache.set(cacheKey, result);
    return result;
  }

  async invalidateBalanceCache(userId: number): Promise<void> {
    await this.cache.del(BALANCE_CACHE_KEY(userId));
  }

  async getGrandLivre(
    userId: number,
    accountId: number,
    dateFrom?: string,
    dateTo?: string,
    page = 1,
    pageSize = 50,
  ): Promise<GrandLivreResponse & { pagination: { total: number; page: number; pageSize: number; totalPages: number } }> {
    const cacheKey = GRAND_LIVRE_CACHE_KEY(userId, accountId, dateFrom, dateTo, page, pageSize);
    const cached = await this.cache.get<GrandLivreResponse & { pagination: any }>(cacheKey);
    if (cached) return cached;

    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Compte introuvable');

    const dateFilter =
      dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {};

    const allLines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        entry: { userId, ...dateFilter },
      },
      include: {
        entry: { select: { id: true, date: true, label: true, pieceNumber: true } },
      },
      orderBy: [{ entry: { date: 'asc' } }, { id: 'asc' }],
    });

    const totalDebit = allLines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = allLines.reduce((s, l) => s + l.credit, 0);

    let cumul = 0;
    const allMapped: GrandLivreLigne[] = allLines.map((l) => {
      cumul += l.debit - l.credit;
      return {
        id: l.id,
        date: l.entry.date,
        label: l.entry.label,
        pieceNumber: l.entry.pieceNumber ?? null,
        entryId: l.entry.id,
        debit: l.debit,
        credit: l.credit,
        soldeCumul: cumul,
        lettre: l.lettre ?? null,
      };
    });

    const offset = (page - 1) * pageSize;
    const result = {
      account: { id: account.id, code: account.code, name: account.name, account_class: account.class },
      lines: allMapped.slice(offset, offset + pageSize),
      totalDebit,
      totalCredit,
      solde: totalDebit - totalCredit,
      pagination: { total: allMapped.length, page, pageSize, totalPages: Math.ceil(allMapped.length / pageSize) },
    };

    await this.cache.set(cacheKey, result);
    return result;
  }

  async getBilan(userId: number, exercice: number): Promise<BilanReport> {
    const yearStart = new Date(`${exercice}-01-01`);
    const yearEnd   = new Date(`${exercice}-12-31T23:59:59.999Z`);

    // Soldes cumulatifs jusqu'à la fin de l'exercice (historique complet)
    const lines = await this.prisma.journalLine.findMany({
      where: { entry: { userId, date: { lte: yearEnd } } },
      include: { account: true },
    });

    const soldes = new Map<number, { code: string; name: string; debit: number; credit: number }>();
    for (const l of lines) {
      if (!soldes.has(l.accountId)) {
        soldes.set(l.accountId, { code: l.account.code, name: l.account.name, debit: 0, credit: 0 });
      }
      const s = soldes.get(l.accountId)!;
      s.debit  += l.debit;
      s.credit += l.credit;
    }

    // Résultat de l'exercice = produits N - charges N
    const yearLines = await this.prisma.journalLine.findMany({
      where: { entry: { userId, date: { gte: yearStart, lte: yearEnd } } },
      include: { account: true },
    });
    let totalProduits = 0;
    let totalCharges  = 0;
    for (const l of yearLines) {
      const c = l.account.code.charAt(0);
      if (c === '7') totalProduits += l.credit - l.debit;
      if (c === '6') totalCharges  += l.debit  - l.credit;
    }
    const resultat = totalProduits - totalCharges;

    const actifPostes: BilanPoste[] = [];
    const passifPostes: BilanPoste[] = [];

    for (const s of soldes.values()) {
      const c = s.code.charAt(0);
      if (c < '1' || c > '5') continue; // exclure 6xx/7xx/8xx/9xx
      const net = s.debit - s.credit;
      if (net > 0) {
        actifPostes.push({ code: s.code, name: s.name, solde: net });
      } else if (net < 0) {
        passifPostes.push({ code: s.code, name: s.name, solde: -net });
      }
    }

    actifPostes.sort((a, b) => a.code.localeCompare(b.code));
    passifPostes.sort((a, b) => a.code.localeCompare(b.code));

    const filterClass = (posts: BilanPoste[], ...prefixes: string[]) =>
      posts.filter(p => prefixes.some(px => p.code.startsWith(px)));

    const actifFiltered = (prefixes: string[]) => filterClass(actifPostes, ...prefixes);
    const passifFiltered = (prefixes: string[]) => filterClass(passifPostes, ...prefixes);
    const usedActif = new Set<string>();
    const usedPassif = new Set<string>();

    const immobilisations   = actifFiltered(['2']);
    const stocks            = actifFiltered(['3']);
    const creances          = actifFiltered(['41', '46']);
    const disponibilites    = actifFiltered(['5']);
    [immobilisations, stocks, creances, disponibilites].flat().forEach(p => usedActif.add(p.code));
    const autresActif = actifPostes.filter(p => !usedActif.has(p.code));

    const capitauxPropres     = passifFiltered(['10', '11', '12', '13', '14', '15']);
    const dettesFinancieres   = passifFiltered(['16']);
    const dettesFournisseurs  = passifFiltered(['401']);
    [capitauxPropres, dettesFinancieres, dettesFournisseurs].flat().forEach(p => usedPassif.add(p.code));
    const autresDettes = passifPostes.filter(p => !usedPassif.has(p.code));

    const totalActif  = actifPostes.reduce((s, p) => s + p.solde, 0);
    const totalPassif = passifPostes.reduce((s, p) => s + p.solde, 0);

    return {
      exercice,
      actif: { immobilisations, stocks, creances, disponibilites, autresActif, total: totalActif },
      passif: { capitauxPropres, dettesFinancieres, dettesFournisseurs, autresDettes, total: totalPassif },
      resultatExercice: resultat,
      equilibre: totalActif === totalPassif + resultat,
    };
  }

  async getCompteDeResultat(userId: number, exercice: number): Promise<CompteResultatReport> {
    const yearStart = new Date(`${exercice}-01-01`);
    const yearEnd   = new Date(`${exercice}-12-31T23:59:59.999Z`);

    const lines = await this.prisma.journalLine.findMany({
      where: { entry: { userId, date: { gte: yearStart, lte: yearEnd } } },
      include: { account: true },
    });

    const soldes = new Map<number, { code: string; name: string; debit: number; credit: number }>();
    for (const l of lines) {
      if (!soldes.has(l.accountId)) {
        soldes.set(l.accountId, { code: l.account.code, name: l.account.name, debit: 0, credit: 0 });
      }
      const s = soldes.get(l.accountId)!;
      s.debit  += l.debit;
      s.credit += l.credit;
    }

    const charges: CompteResultatPoste[] = [];
    const produits: CompteResultatPoste[] = [];

    for (const s of soldes.values()) {
      const c = s.code.charAt(0);
      if (c === '6') {
        const net = s.debit - s.credit;
        if (net !== 0) charges.push({ code: s.code, name: s.name, montant: net });
      } else if (c === '7') {
        const net = s.credit - s.debit;
        if (net !== 0) produits.push({ code: s.code, name: s.name, montant: net });
      }
    }

    charges.sort((a, b) => a.code.localeCompare(b.code));
    produits.sort((a, b) => a.code.localeCompare(b.code));

    const totalCharges  = charges.reduce((s, p) => s + p.montant, 0);
    const totalProduits = produits.reduce((s, p) => s + p.montant, 0);

    return {
      exercice,
      charges,
      produits,
      totalCharges,
      totalProduits,
      resultat: totalProduits - totalCharges,
    };
  }

  // ─── Helpers FEC partagés ─────────────────────────────────────────────────

  private static fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  private static fmtAmt(centimes: number): string {
    return (centimes / 100).toFixed(2).replace('.', ',');
  }

  private static readonly JOURNAL_LABELS: Record<string, string> = {
    ACHATS: 'Journal des achats',
    VENTES: 'Journal des ventes',
    BANQUE: 'Journal de banque',
    CAISSE: 'Journal de caisse',
    OD:     'Opérations diverses',
  };

  private static readonly FEC_COLUMNS = [
    'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
    'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
    'PieceRef', 'PieceDate', 'EcritureLib',
    'Debit', 'Credit', 'EcritureLet', 'DateLet', 'ValidDate',
    'Montantdevise', 'Idevise',
  ] as const;

  private async resolveFecDates(
    userId: number,
    exerciceId?: number,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{ dateFrom?: string; dateTo?: string; annee?: number }> {
    if (!exerciceId) return { dateFrom, dateTo };
    const fy = await this.prisma.fiscalYear.findFirst({ where: { id: exerciceId, userId } });
    if (!fy) throw new NotFoundException('Exercice fiscal introuvable');
    return {
      dateFrom: `${fy.annee}-01-01`,
      dateTo:   `${fy.annee}-12-31`,
      annee:    fy.annee,
    };
  }

  private async fetchFecRows(userId: number, dateFrom?: string, dateTo?: string) {
    const dateFilter =
      dateFrom || dateTo
        ? { date: { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) } }
        : {};

    const lines = await this.prisma.journalLine.findMany({
      where: { entry: { userId, ...dateFilter } },
      include: { account: true, entry: { include: { journal: true } } },
      orderBy: [{ entry: { date: 'asc' } }, { entry: { id: 'asc' } }, { id: 'asc' }],
    });

    return lines.map((l) => {
      const jCode = l.entry.journal?.type ?? 'OD';
      const jLib  = l.entry.journal
        ? (RapportsService.JOURNAL_LABELS[l.entry.journal.type] ?? l.entry.journal.type)
        : 'Opérations diverses';
      const date        = RapportsService.fmtDate(l.entry.date);
      const ecritureNum = l.entry.pieceNumber ?? String(l.entry.id);
      return {
        JournalCode:   jCode.substring(0, 6),
        JournalLib:    jLib,
        EcritureNum:   ecritureNum.substring(0, 20),
        EcritureDate:  date,
        CompteNum:     l.account.code.substring(0, 15),
        CompteLib:     l.account.name,
        CompAuxNum:    '',
        CompAuxLib:    '',
        PieceRef:      (l.entry.pieceNumber ?? '').substring(0, 20),
        PieceDate:     date,
        EcritureLib:   l.entry.label.substring(0, 100),
        Debit:         RapportsService.fmtAmt(l.debit),
        Credit:        RapportsService.fmtAmt(l.credit),
        EcritureLet:   l.lettre ?? '',
        DateLet:       '',
        ValidDate:     date,
        Montantdevise: '',
        Idevise:       '',
      };
    });
  }

  // ─── FEC TXT (obligation légale DGFiP) ────────────────────────────────────

  async getFec(userId: number, dateFrom?: string, dateTo?: string, exerciceId?: number): Promise<{ content: string; annee?: number }> {
    const resolved = await this.resolveFecDates(userId, exerciceId, dateFrom, dateTo);
    const rows = await this.fetchFecRows(userId, resolved.dateFrom, resolved.dateTo);
    const header = RapportsService.FEC_COLUMNS.join('|');
    const lines  = rows.map((r) => RapportsService.FEC_COLUMNS.map((c) => r[c]).join('|'));
    // BOM UTF-8 + CRLF — conformité DGFiP
    return { content: '﻿' + [header, ...lines].join('\r\n'), annee: resolved.annee };
  }

  // ─── FEC Excel ────────────────────────────────────────────────────────────

  async getFecExcel(userId: number, dateFrom?: string, dateTo?: string, exerciceId?: number): Promise<{ buffer: Buffer; annee?: number }> {
    const resolved = await this.resolveFecDates(userId, exerciceId, dateFrom, dateTo);
    const rows = await this.fetchFecRows(userId, resolved.dateFrom, resolved.dateTo);

    const wsData = [
      RapportsService.FEC_COLUMNS as unknown as string[],
      ...rows.map((r) => RapportsService.FEC_COLUMNS.map((c) => r[c])),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style de l'en-tête
    const headerRange = XLSX.utils.decode_range(ws['!ref']!);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
      if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: '0D1B2A' } } };
    }

    // Largeurs de colonnes automatiques
    ws['!cols'] = [
      { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 12 },
      { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 20 },
      { wch: 16 }, { wch: 12 }, { wch: 40 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 8 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'FEC');
    return { buffer: Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })), annee: resolved.annee };
  }

  // ─── Validation FEC (contrôles pré-DGFiP) ────────────────────────────────

  async validateFec(userId: number, dateFrom?: string, dateTo?: string, exerciceId?: number): Promise<{
    valid: boolean;
    lignes: number;
    erreurs: string[];
    avertissements: string[];
  }> {
    const resolved = await this.resolveFecDates(userId, exerciceId, dateFrom, dateTo);
    const rows = await this.fetchFecRows(userId, resolved.dateFrom, resolved.dateTo);
    const erreurs: string[] = [];
    const avertissements: string[] = [];

    const DATE_RE  = /^\d{8}$/;
    const AMOUNT_RE = /^\d+,\d{2}$/;

    rows.forEach((r, i) => {
      const n = i + 2; // ligne Excel (1 = header)
      if (!r.JournalCode)                 erreurs.push(`L${n} : JournalCode vide`);
      if (r.JournalCode.length > 6)       erreurs.push(`L${n} : JournalCode > 6 caractères (${r.JournalCode})`);
      if (!r.EcritureNum)                 erreurs.push(`L${n} : EcritureNum vide`);
      if (!DATE_RE.test(r.EcritureDate))  erreurs.push(`L${n} : EcritureDate invalide (${r.EcritureDate})`);
      if (!r.CompteNum)                   erreurs.push(`L${n} : CompteNum vide`);
      if (r.CompteNum.length > 15)        erreurs.push(`L${n} : CompteNum > 15 caractères`);
      if (!AMOUNT_RE.test(r.Debit))       erreurs.push(`L${n} : Debit invalide (${r.Debit})`);
      if (!AMOUNT_RE.test(r.Credit))      erreurs.push(`L${n} : Credit invalide (${r.Credit})`);
      if (r.Debit === '0,00' && r.Credit === '0,00')
        avertissements.push(`L${n} : Ligne à zéro (${r.CompteNum})`);
    });

    // Vérifier l'équilibre global
    const totalDebit  = rows.reduce((s, r) => s + Number.parseFloat(r.Debit.replace(',', '.')), 0);
    const totalCredit = rows.reduce((s, r) => s + Number.parseFloat(r.Credit.replace(',', '.')), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      erreurs.push(`Déséquilibre global : Débit ${totalDebit.toFixed(2)} ≠ Crédit ${totalCredit.toFixed(2)}`);
    }

    if (rows.length === 0) {
      avertissements.push('Aucune écriture dans la période sélectionnée');
    }

    return { valid: erreurs.length === 0, lignes: rows.length, erreurs, avertissements };
  }
}
