import { ImportReleveData, ParsedLigne } from '../../application/ports/rapprochement.repository.interface';

/**
 * Parse un fichier CSV bancaire.
 * Supporte les formats courants des banques françaises :
 *   - Séparateur : ; ou ,
 *   - Format débit/crédit séparés ou montant unique
 *   - Dates : DD/MM/YYYY ou YYYY-MM-DD
 */
export class CsvParser {
  static parse(content: string, filename: string): ImportReleveData {
    // Normalise les fins de ligne
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());

    if (lines.length < 2) {
      return { nom: filename, lignes: [] };
    }

    // Détecte le séparateur
    const sep = lines[0].includes(';') ? ';' : ',';

    const headers = lines[0].split(sep).map(h =>
      h.trim().toLowerCase().replace(/["""]/g, '').replace(/\s+/g, '_'),
    );

    const colDate    = findCol(headers, ['date', 'date_operation', 'date_op', 'date_comptable']);
    const colLibelle = findCol(headers, ['libelle', 'libellé', 'label', 'description', 'intitule', 'intitulé', 'detail', 'détail', 'nom']);
    const colMontant = findCol(headers, ['montant', 'amount', 'solde']);
    const colDebit   = findCol(headers, ['debit', 'débit', 'debit_euros', 'montant_debit']);
    const colCredit  = findCol(headers, ['credit', 'crédit', 'credit_euros', 'montant_credit']);
    const colRef     = findCol(headers, ['reference', 'réference', 'ref', 'numero', 'numéro', 'id', 'fitid']);

    const lignes: ParsedLigne[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = splitCsvLine(lines[i], sep);
      if (cells.length < 2) continue;

      const dateRaw    = colDate    !== -1 ? clean(cells[colDate])    : '';
      const libelleRaw = colLibelle !== -1 ? clean(cells[colLibelle]) : '';

      if (!dateRaw || !libelleRaw) continue;

      const date = parseDate(dateRaw);
      if (!date) continue;

      let montantCentimes: number | null = null;

      if (colMontant !== -1) {
        montantCentimes = parseMontant(clean(cells[colMontant]));
      } else if (colDebit !== -1 || colCredit !== -1) {
        const debitVal  = colDebit  !== -1 ? parseMontant(clean(cells[colDebit]))  ?? 0 : 0;
        const creditVal = colCredit !== -1 ? parseMontant(clean(cells[colCredit])) ?? 0 : 0;
        montantCentimes = creditVal - debitVal;
      }

      if (montantCentimes === null) continue;

      lignes.push({
        date,
        libelle: libelleRaw,
        montant: montantCentimes,
        reference: colRef !== -1 ? clean(cells[colRef]) || undefined : undefined,
      });
    }

    return { nom: filename, lignes };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function findCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.indexOf(c);
    if (idx !== -1) return idx;
  }
  return -1;
}

function clean(val: string): string {
  return val?.trim().replace(/^["']|["']$/g, '') ?? '';
}

function splitCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseDate(raw: string): Date | null {
  // DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    return new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}T00:00:00`);
  }
  // YYYY-MM-DD
  const ymd = raw.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymd) {
    return new Date(`${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}T00:00:00`);
  }
  return null;
}

function parseMontant(raw: string): number | null {
  if (!raw) return null;
  // Retire les espaces, remplace la virgule décimale par un point
  const clean = raw.replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(clean);
  if (isNaN(val)) return null;
  return Math.round(val * 100);
}
