import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class RapportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: number): Promise<BalanceLine[]> {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      include: { journalLines: true },
      orderBy: { code: 'asc' },
    });

    return accounts.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      account_class: a.class,
      totalDebit: a.journalLines.reduce((s, l) => s + l.debit, 0),
      totalCredit: a.journalLines.reduce((s, l) => s + l.credit, 0),
    }));
  }

  async getGrandLivre(
    userId: number,
    accountId: number,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<GrandLivreResponse> {
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

    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        entry: { userId, ...dateFilter },
      },
      include: {
        entry: { select: { id: true, date: true, label: true, pieceNumber: true } },
      },
      orderBy: [{ entry: { date: 'asc' } }, { id: 'asc' }],
    });

    let cumul = 0;
    const mappedLines: GrandLivreLigne[] = lines.map((l) => {
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

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    return {
      account: { id: account.id, code: account.code, name: account.name, account_class: account.class },
      lines: mappedLines,
      totalDebit,
      totalCredit,
      solde: totalDebit - totalCredit,
    };
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

  async getFec(userId: number, dateFrom?: string, dateTo?: string): Promise<string> {
    const dateFilter =
      dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {};

    const lines = await this.prisma.journalLine.findMany({
      where: { entry: { userId, ...dateFilter } },
      include: {
        account: true,
        entry: { include: { journal: true } },
      },
      orderBy: [{ entry: { date: 'asc' } }, { entry: { id: 'asc' } }, { id: 'asc' }],
    });

    const fmtDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}${m}${day}`;
    };

    const fmtAmt = (centimes: number): string =>
      (centimes / 100).toFixed(2).replace('.', ',');

    const JOURNAL_LABELS: Record<string, string> = {
      ACHATS: 'Journal des achats',
      VENTES: 'Journal des ventes',
      BANQUE: 'Journal de banque',
      CAISSE: 'Journal de caisse',
      OD: 'Opérations diverses',
    };

    const header =
      'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise';

    const rows = lines.map((l) => {
      const journal = l.entry.journal;
      const jCode = journal?.type ?? 'OD';
      const jLib = journal ? (JOURNAL_LABELS[journal.type] ?? journal.type) : 'Opérations diverses';
      const date = fmtDate(l.entry.date);
      const ecritureNum = l.entry.pieceNumber ?? String(l.entry.id);
      return [
        jCode,
        jLib,
        ecritureNum,
        date,
        l.account.code,
        l.account.name,
        '',
        '',
        l.entry.pieceNumber ?? '',
        date,
        l.entry.label.substring(0, 100),
        fmtAmt(l.debit),
        fmtAmt(l.credit),
        l.lettre ?? '',
        '',
        date,
        '',
        '',
      ].join('|');
    });

    return [header, ...rows].join('\r\n');
  }
}
