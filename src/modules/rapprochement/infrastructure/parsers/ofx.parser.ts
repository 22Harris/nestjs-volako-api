import { ImportReleveData, ParsedLigne } from '../../application/ports/rapprochement.repository.interface';

/**
 * Parse un fichier OFX (Open Financial Exchange).
 * Supporte OFX 1.x (SGML header + SGML/XML body) et OFX 2.x (XML pur).
 */
export class OfxParser {
  static parse(content: string, filename: string): ImportReleveData {
    // Retire les en-têtes SGML type "OFXHEADER:100\n..."
    const xmlStart = content.indexOf('<OFX>');
    const body = xmlStart >= 0 ? content.slice(xmlStart) : content;

    // Normalise : ferme les balises SGML ouvertes non fermées (OFX 1.x)
    const normalized = normalizeSgml(body);

    const lignes: ParsedLigne[] = extractTransactions(normalized);

    // Soldes
    const soldeFin   = extractAmount(normalized, 'LEDGERBAL', 'BALAMT');
    const soldeDebut = extractAmount(normalized, 'AVAILBAL',  'BALAMT');

    // Dates
    const dtStart = extractTag(normalized, 'DTSTART');
    const dtEnd   = extractTag(normalized, 'DTEND');

    return {
      nom: filename,
      dateDebut: dtStart ? parseOfxDate(dtStart) ?? undefined : undefined,
      dateFin:   dtEnd   ? parseOfxDate(dtEnd)   ?? undefined : undefined,
      soldeDebut: soldeDebut ?? undefined,
      soldeFin:   soldeFin   ?? undefined,
      lignes,
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeSgml(content: string): string {
  // Ferme les balises SGML ouvertes : <TAG>value → <TAG>value</TAG>
  // Regex simple : une balise ouvrante suivie d'un contenu sans sous-balises
  return content.replace(/<([A-Z.]+)>([^<]+)/g, (_, tag, val) => `<${tag}>${val.trim()}</${tag}>`);
}

function extractTransactions(xml: string): ParsedLigne[] {
  const transactions: ParsedLigne[] = [];
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  while ((match = stmtTrnRegex.exec(xml)) !== null) {
    const block = match[1];

    const dateRaw = extractTag(block, 'DTPOSTED') ?? extractTag(block, 'DTUSER');
    const amtRaw  = extractTag(block, 'TRNAMT');
    const name    = extractTag(block, 'NAME') ?? extractTag(block, 'MEMO') ?? '';
    const fitid   = extractTag(block, 'FITID');

    if (!dateRaw || !amtRaw) continue;

    const date = parseOfxDate(dateRaw);
    if (!date) continue;

    const montant = parseOfxAmount(amtRaw);
    if (montant === null) continue;

    transactions.push({
      date,
      libelle: name,
      montant,
      reference: fitid ?? undefined,
    });
  }

  return transactions;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<]*)<\/${tag}>`, 'i');
  const m = xml.match(regex);
  return m ? m[1].trim() : null;
}

function extractAmount(xml: string, containerTag: string, valueTag: string): number | null {
  const containerRegex = new RegExp(`<${containerTag}>([\\s\\S]*?)<\\/${containerTag}>`, 'i');
  const containerMatch = xml.match(containerRegex);
  if (!containerMatch) return null;
  const raw = extractTag(containerMatch[1], valueTag);
  return raw ? parseOfxAmount(raw) : null;
}

function parseOfxDate(raw: string): Date | null {
  // OFX format: YYYYMMDDHHMMSS or YYYYMMDD
  const cleaned = raw.replace(/[.\[\]]/g, '').trim();
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
}

function parseOfxAmount(raw: string): number | null {
  const val = parseFloat(raw.replace(',', '.'));
  if (isNaN(val)) return null;
  return Math.round(val * 100);
}
