import { NotFoundException } from '@nestjs/common';
import { RapportsService } from './rapports.service';

// ─── Prisma mock helpers ──────────────────────────────────────────────────────

function buildPrisma(overrides: {
  accountFindMany?: jest.Mock;
  accountFindFirst?: jest.Mock;
  journalLineFindMany?: jest.Mock;
} = {}) {
  return {
    account: {
      findMany: overrides.accountFindMany ?? jest.fn().mockResolvedValue([]),
      findFirst: overrides.accountFindFirst ?? jest.fn().mockResolvedValue(null),
    },
    journalLine: {
      findMany: overrides.journalLineFindMany ?? jest.fn().mockResolvedValue([]),
    },
  };
}

const mockCache = { get: jest.fn(), set: jest.fn().mockResolvedValue(undefined) };

beforeEach(() => {
  mockCache.get.mockResolvedValue(null);
  mockCache.set.mockResolvedValue(undefined);
});

function buildService(prisma: ReturnType<typeof buildPrisma>): RapportsService {
  return new RapportsService(prisma as any, mockCache as any);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID  = 1;
const EXERCICE = 2023;

function makeAccount(id: number, code: string, name: string, cls: number, lines: any[] = []) {
  return { id, code, name, class: cls, journalLines: lines };
}

function makeJournalLine(opts: {
  id?: number;
  debit: number;
  credit: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  accountClass?: number;
  lettre?: string | null;
  entry?: Partial<{ id: number; date: Date; label: string; pieceNumber: string | null }>;
}) {
  return {
    id: opts.id ?? 1,
    debit: opts.debit,
    credit: opts.credit,
    accountId: opts.accountId,
    lettre: opts.lettre ?? null,
    account: {
      id: opts.accountId,
      code: opts.accountCode,
      name: opts.accountName,
      class: opts.accountClass ?? Number(opts.accountCode.charAt(0)),
    },
    entry: {
      id: opts.entry?.id ?? 1,
      date: opts.entry?.date ?? new Date(`${EXERCICE}-06-15`),
      label: opts.entry?.label ?? 'Écriture de test',
      pieceNumber: opts.entry?.pieceNumber ?? null,
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// BALANCE
// ══════════════════════════════════════════════════════════════════════════════

describe('RapportsService.getBalance()', () => {

  it('retourne un tableau vide quand aucun compte n\'existe', async () => {
    const prisma = buildPrisma();
    const result = await buildService(prisma).getBalance(USER_ID);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('mappe les comptes en BalanceLine avec les totaux corrects', async () => {
    const prisma = buildPrisma({
      accountFindMany: jest.fn().mockResolvedValue([
        makeAccount(1, '411000', 'Clients', 4, [
          { debit: 120000, credit: 0 },
          { debit: 30000,  credit: 0 },
        ]),
      ]),
    });

    const result = await buildService(prisma).getBalance(USER_ID);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id:           1,
      code:         '411000',
      name:         'Clients',
      account_class: 4,
      totalDebit:   150000,
      totalCredit:  0,
    });
  });

  it('gère les comptes avec débit et crédit', async () => {
    const prisma = buildPrisma({
      accountFindMany: jest.fn().mockResolvedValue([
        makeAccount(2, '512000', 'Banque', 5, [
          { debit: 200000, credit: 0  },
          { debit: 0,      credit: 50000 },
          { debit: 10000,  credit: 0  },
        ]),
      ]),
    });

    const result = await buildService(prisma).getBalance(USER_ID);
    expect(result.data[0].totalDebit).toBe(210000);
    expect(result.data[0].totalCredit).toBe(50000);
  });

  it('retourne les métadonnées de pagination', async () => {
    const accounts = Array.from({ length: 3 }, (_, i) => makeAccount(i + 1, `60${i}000`, `Compte ${i}`, 6, []));
    const prisma = buildPrisma({ accountFindMany: jest.fn().mockResolvedValue(accounts) });

    const result = await buildService(prisma).getBalance(USER_ID, 1, 50);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.totalPages).toBe(1);
  });

  it('retourne la résultat depuis le cache si disponible', async () => {
    const cached = { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
    mockCache.get.mockResolvedValue(cached);
    const prisma = buildPrisma();

    const result = await buildService(prisma).getBalance(USER_ID);
    expect(result).toBe(cached);
    expect(prisma.account.findMany).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GRAND LIVRE
// ══════════════════════════════════════════════════════════════════════════════

describe('RapportsService.getGrandLivre()', () => {
  const account = { id: 10, code: '411000', name: 'Clients', class: 4 };

  it('throws NotFoundException when account does not exist', async () => {
    const prisma = buildPrisma({ accountFindFirst: jest.fn().mockResolvedValue(null) });
    await expect(buildService(prisma).getGrandLivre(USER_ID, 99)).rejects.toThrow(NotFoundException);
  });

  it('returns empty lines with zero totals for an account with no movements', async () => {
    const prisma = buildPrisma({
      accountFindFirst: jest.fn().mockResolvedValue(account),
      journalLineFindMany: jest.fn().mockResolvedValue([]),
    });

    const result = await buildService(prisma).getGrandLivre(USER_ID, 10);
    expect(result.lines).toHaveLength(0);
    expect(result.totalDebit).toBe(0);
    expect(result.totalCredit).toBe(0);
    expect(result.solde).toBe(0);
  });

  it('calculates cumulative balance progressively', async () => {
    const prisma = buildPrisma({
      accountFindFirst: jest.fn().mockResolvedValue(account),
      journalLineFindMany: jest.fn().mockResolvedValue([
        makeJournalLine({ id: 1, debit: 100000, credit: 0,     accountId: 10, accountCode: '411000', accountName: 'Clients' }),
        makeJournalLine({ id: 2, debit: 0,      credit: 40000, accountId: 10, accountCode: '411000', accountName: 'Clients' }),
        makeJournalLine({ id: 3, debit: 50000,  credit: 0,     accountId: 10, accountCode: '411000', accountName: 'Clients' }),
      ]),
    });

    const result = await buildService(prisma).getGrandLivre(USER_ID, 10);
    expect(result.lines[0].soldeCumul).toBe(100000);
    expect(result.lines[1].soldeCumul).toBe(60000);
    expect(result.lines[2].soldeCumul).toBe(110000);
  });

  it('exposes correct totalDebit, totalCredit, solde', async () => {
    const prisma = buildPrisma({
      accountFindFirst: jest.fn().mockResolvedValue(account),
      journalLineFindMany: jest.fn().mockResolvedValue([
        makeJournalLine({ debit: 80000, credit: 0,     accountId: 10, accountCode: '411000', accountName: 'Clients' }),
        makeJournalLine({ debit: 0,     credit: 30000, accountId: 10, accountCode: '411000', accountName: 'Clients' }),
      ]),
    });

    const result = await buildService(prisma).getGrandLivre(USER_ID, 10);
    expect(result.totalDebit).toBe(80000);
    expect(result.totalCredit).toBe(30000);
    expect(result.solde).toBe(50000);
  });

  it('includes lettre when present on a line', async () => {
    const prisma = buildPrisma({
      accountFindFirst: jest.fn().mockResolvedValue(account),
      journalLineFindMany: jest.fn().mockResolvedValue([
        makeJournalLine({ debit: 100, credit: 0, accountId: 10, accountCode: '411000', accountName: 'Clients', lettre: 'A' }),
      ]),
    });

    const result = await buildService(prisma).getGrandLivre(USER_ID, 10);
    expect(result.lines[0].lettre).toBe('A');
  });

  it('returns cache hit without calling prisma', async () => {
    const cached = { account: {}, lines: [], totalDebit: 0, totalCredit: 0, solde: 0, pagination: {} };
    mockCache.get.mockResolvedValue(cached);
    const prisma = buildPrisma({ accountFindFirst: jest.fn() });

    const result = await buildService(prisma).getGrandLivre(USER_ID, 10);
    expect(result).toBe(cached);
    expect(prisma.account.findFirst).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// BILAN
// ══════════════════════════════════════════════════════════════════════════════

describe('RapportsService.getBilan()', () => {
  it('returns empty sections when there are no journal lines', async () => {
    const prisma = buildPrisma({ journalLineFindMany: jest.fn().mockResolvedValue([]) });
    const result = await buildService(prisma).getBilan(USER_ID, EXERCICE);

    expect(result.exercice).toBe(EXERCICE);
    expect(result.actif.total).toBe(0);
    expect(result.passif.total).toBe(0);
    expect(result.resultatExercice).toBe(0);
    expect(result.equilibre).toBe(true);
  });

  it('classifies debit-balance accounts as actif', async () => {
    // Account 512000 (Banque, class 5) with net debit balance
    const jl = makeJournalLine({ debit: 100000, credit: 0, accountId: 1, accountCode: '512000', accountName: 'Banque' });
    const prisma = buildPrisma({
      journalLineFindMany: jest.fn().mockResolvedValue([jl, jl]),
    });

    const result = await buildService(prisma).getBilan(USER_ID, EXERCICE);
    const banque = result.actif.disponibilites.find(p => p.code === '512000');
    expect(banque).toBeDefined();
    expect(banque!.solde).toBeGreaterThan(0);
  });

  it('classifies credit-balance accounts as passif', async () => {
    // Account 401000 (Fournisseurs, class 4) with net credit balance
    const jl = makeJournalLine({ debit: 0, credit: 80000, accountId: 2, accountCode: '401000', accountName: 'Fournisseurs' });
    const prisma = buildPrisma({ journalLineFindMany: jest.fn().mockResolvedValue([jl, jl]) });

    const result = await buildService(prisma).getBilan(USER_ID, EXERCICE);
    const fourn = result.passif.dettesFournisseurs.find(p => p.code === '401000');
    expect(fourn).toBeDefined();
  });

  it('excludes class 6 and 7 accounts from the bilan (they go to compte de résultat)', async () => {
    const chargesJl = makeJournalLine({ debit: 50000, credit: 0, accountId: 3, accountCode: '601000', accountName: 'Achats' });
    const prisma = buildPrisma({ journalLineFindMany: jest.fn().mockResolvedValue([chargesJl]) });

    const result = await buildService(prisma).getBilan(USER_ID, EXERCICE);
    // charges should not appear in actif/passif
    const allPostes = [
      ...result.actif.immobilisations,
      ...result.actif.stocks,
      ...result.actif.creances,
      ...result.actif.disponibilites,
      ...result.actif.autresActif,
      ...result.passif.capitauxPropres,
      ...result.passif.dettesFinancieres,
      ...result.passif.dettesFournisseurs,
      ...result.passif.autresDettes,
    ];
    expect(allPostes.some(p => p.code === '601000')).toBe(false);
  });

  it('marks equilibre=true when actif === passif + résultat', async () => {
    // One debit balance actif account (5xx) and one credit balance passif (1xx) of the same amount
    const actifJl = makeJournalLine({ debit: 50000, credit: 0, accountId: 1, accountCode: '512000', accountName: 'Banque' });
    const passifJl = makeJournalLine({ debit: 0, credit: 50000, accountId: 2, accountCode: '101000', accountName: 'Capital' });
    // For second call (yearLines) return empty (no charges/produits)
    const findMany = jest.fn()
      .mockResolvedValueOnce([actifJl, passifJl])  // cumulative lines
      .mockResolvedValueOnce([]);                   // year lines

    const prisma = buildPrisma({ journalLineFindMany: findMany });
    const result = await buildService(prisma).getBilan(USER_ID, EXERCICE);

    expect(result.actif.total).toBe(50000);
    expect(result.passif.total).toBe(50000);
    expect(result.resultatExercice).toBe(0);
    expect(result.equilibre).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// COMPTE DE RÉSULTAT
// ══════════════════════════════════════════════════════════════════════════════

describe('RapportsService.getCompteDeResultat()', () => {
  it('returns zero totals when there are no movements', async () => {
    const prisma = buildPrisma({ journalLineFindMany: jest.fn().mockResolvedValue([]) });
    const result = await buildService(prisma).getCompteDeResultat(USER_ID, EXERCICE);

    expect(result.totalCharges).toBe(0);
    expect(result.totalProduits).toBe(0);
    expect(result.resultat).toBe(0);
  });

  it('groups class-6 lines as charges', async () => {
    const lines = [
      makeJournalLine({ debit: 30000, credit: 0, accountId: 1, accountCode: '601000', accountName: 'Achats matières' }),
      makeJournalLine({ debit: 20000, credit: 0, accountId: 2, accountCode: '615000', accountName: 'Entretien' }),
    ];
    const prisma = buildPrisma({ journalLineFindMany: jest.fn().mockResolvedValue(lines) });
    const result = await buildService(prisma).getCompteDeResultat(USER_ID, EXERCICE);

    expect(result.charges).toHaveLength(2);
    expect(result.totalCharges).toBe(50000);
    expect(result.produits).toHaveLength(0);
    expect(result.resultat).toBe(-50000); // perte
  });

  it('groups class-7 lines as produits', async () => {
    const lines = [
      makeJournalLine({ debit: 0, credit: 80000, accountId: 3, accountCode: '701000', accountName: 'Ventes' }),
    ];
    const prisma = buildPrisma({ journalLineFindMany: jest.fn().mockResolvedValue(lines) });
    const result = await buildService(prisma).getCompteDeResultat(USER_ID, EXERCICE);

    expect(result.produits).toHaveLength(1);
    expect(result.totalProduits).toBe(80000);
    expect(result.resultat).toBe(80000); // bénéfice
  });

  it('calculates net result: produits − charges', async () => {
    const lines = [
      makeJournalLine({ debit: 0,     credit: 100000, accountId: 3, accountCode: '701000', accountName: 'Ventes' }),
      makeJournalLine({ debit: 40000, credit: 0,      accountId: 1, accountCode: '601000', accountName: 'Achats' }),
    ];
    const prisma = buildPrisma({ journalLineFindMany: jest.fn().mockResolvedValue(lines) });
    const result = await buildService(prisma).getCompteDeResultat(USER_ID, EXERCICE);

    expect(result.totalProduits).toBe(100000);
    expect(result.totalCharges).toBe(40000);
    expect(result.resultat).toBe(60000);
  });

  it('aggregates multiple lines for the same account', async () => {
    const lines = [
      makeJournalLine({ debit: 10000, credit: 0, accountId: 1, accountCode: '601000', accountName: 'Achats' }),
      makeJournalLine({ debit: 15000, credit: 0, accountId: 1, accountCode: '601000', accountName: 'Achats' }),
    ];
    const prisma = buildPrisma({ journalLineFindMany: jest.fn().mockResolvedValue(lines) });
    const result = await buildService(prisma).getCompteDeResultat(USER_ID, EXERCICE);

    // Should be aggregated into one charge poste
    expect(result.charges).toHaveLength(1);
    expect(result.charges[0].montant).toBe(25000);
  });
});
