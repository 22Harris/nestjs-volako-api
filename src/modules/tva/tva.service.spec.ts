import { TvaService } from './tva.service';

// ─── Minimal PrismaService mock ───────────────────────────────────────────────

function makePrisma(overrides: Partial<{ findMany: jest.Mock }> = {}) {
  const findMany = overrides.findMany ?? jest.fn().mockResolvedValue([]);
  return {
    journalLine: { findMany },
  };
}

// ─── Factory ─────────────────────────────────────────────────────────────────

function buildService(prismaOverrides?: Partial<{ findMany: jest.Mock }>): {
  svc: TvaService;
  findMany: jest.Mock;
} {
  const findMany = jest.fn().mockResolvedValue([]);
  const prisma = { journalLine: { findMany } };
  const svc = new TvaService(prisma as any);
  return { svc, findMany };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a journal line stub for findMany returns */
function line(opts: { debit?: number; credit?: number; codeTva?: string }) {
  return { debit: opts.debit ?? 0, credit: opts.credit ?? 0, codeTva: opts.codeTva ?? null };
}

const DATE_FROM = '2023-01-01';
const DATE_TO   = '2023-12-31';
const USER_ID   = 1;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TvaService.getCa3()', () => {
  // ── Empty result ─────────────────────────────────────────────────────────────

  it('returns zero totals when there are no journal lines', async () => {
    const { svc } = buildService();
    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);

    expect(report.tvaCollectee.totalBaseHt).toBe(0);
    expect(report.tvaCollectee.totalTva).toBe(0);
    expect(report.tvaDeductible.total).toBe(0);
    expect(report.soldeTva).toBe(0);
    expect(report.tvaAPayer).toBe(0);
    expect(report.creditTva).toBe(0);
  });

  it('echoes back the date range', async () => {
    const { svc } = buildService();
    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    expect(report.dateFrom).toBe(DATE_FROM);
    expect(report.dateTo).toBe(DATE_TO);
  });

  // ── TVA collectée — base HT par taux ────────────────────────────────────────

  it('calculates base HT and TVA brute from tagged credit lines at 20%', async () => {
    const { svc, findMany } = buildService();
    // Call 1: tagged credit lines (base HT)
    findMany.mockResolvedValueOnce([
      line({ credit: 100000, codeTva: 'NORMAL_20' }),
      line({ credit: 50000,  codeTva: 'NORMAL_20' }),
    ]);
    // Call 2: 44571* collectée lines → 0
    findMany.mockResolvedValueOnce([]);
    // Call 3: 44562* immobilisations → 0
    findMany.mockResolvedValueOnce([]);
    // Call 4: 44566* biens/services → 0
    findMany.mockResolvedValueOnce([]);

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);

    const ligne20 = report.tvaCollectee.lignes.find(l => l.codeTva === 'NORMAL_20');
    expect(ligne20).toBeDefined();
    expect(ligne20!.baseHt).toBe(150000);
    // 150000 * 20 / 100 = 30000
    expect(ligne20!.tvaBrute).toBe(30000);
  });

  it('builds separate lines per TVA code', async () => {
    const { svc, findMany } = buildService();
    findMany.mockResolvedValueOnce([
      line({ credit: 100000, codeTva: 'NORMAL_20' }),
      line({ credit: 60000,  codeTva: 'INTERMEDIAIRE_10' }),
    ]);
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    const codes = report.tvaCollectee.lignes.map(l => l.codeTva);
    expect(codes).toContain('NORMAL_20');
    expect(codes).toContain('INTERMEDIAIRE_10');
  });

  it('EXONERE lines contribute to base HT but zero TVA brute', async () => {
    const { svc, findMany } = buildService();
    findMany.mockResolvedValueOnce([
      line({ credit: 200000, codeTva: 'EXONERE' }),
    ]);
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    const exonere = report.tvaCollectee.lignes.find(l => l.codeTva === 'EXONERE');
    expect(exonere!.tvaBrute).toBe(0);
    expect(exonere!.baseHt).toBe(200000);
  });

  // ── Real 44571 collectée takes precedence ────────────────────────────────────

  it('uses real 44571 credit amount when it is > 0, ignoring calculated TVA', async () => {
    const { svc, findMany } = buildService();
    // tagged lines: base HT 100000 → calculated TVA = 20000
    findMany.mockResolvedValueOnce([line({ credit: 100000, codeTva: 'NORMAL_20' })]);
    // 44571 lines: actual TVA posted = 25000 (differs from calculated)
    findMany.mockResolvedValueOnce([line({ credit: 25000 })]);
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    // Should use real 44571 amount, not calculated
    expect(report.tvaCollectee.totalTva).toBe(25000);
  });

  it('falls back to calculated TVA when 44571 credit is 0', async () => {
    const { svc, findMany } = buildService();
    findMany.mockResolvedValueOnce([line({ credit: 100000, codeTva: 'NORMAL_20' })]);
    findMany.mockResolvedValueOnce([]); // no 44571 lines
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    // Calculated: 100000 * 20 / 100 = 20000
    expect(report.tvaCollectee.totalTva).toBe(20000);
  });

  // ── TVA déductible ───────────────────────────────────────────────────────────

  it('sums debit lines on 44562* as deductible immobilisations', async () => {
    const { svc, findMany } = buildService();
    findMany.mockResolvedValueOnce([]);  // tagged
    findMany.mockResolvedValueOnce([]);  // 44571
    findMany.mockResolvedValueOnce([    // 44562
      line({ debit: 10000 }),
      line({ debit: 5000  }),
    ]);
    findMany.mockResolvedValueOnce([]);  // 44566

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    expect(report.tvaDeductible.surImmobilisations).toBe(15000);
    expect(report.tvaDeductible.total).toBe(15000);
  });

  it('sums debit lines on 44566* as deductible biens/services', async () => {
    const { svc, findMany } = buildService();
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);   // 44562 = 0
    findMany.mockResolvedValueOnce([     // 44566
      line({ debit: 8000 }),
    ]);

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    expect(report.tvaDeductible.surAutresBiensServices).toBe(8000);
    expect(report.tvaDeductible.total).toBe(8000);
  });

  it('sums both 44562 and 44566 in the deductible total', async () => {
    const { svc, findMany } = buildService();
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([line({ debit: 3000 })]);  // 44562
    findMany.mockResolvedValueOnce([line({ debit: 7000 })]);  // 44566

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    expect(report.tvaDeductible.total).toBe(10000);
  });

  // ── Solde & résultat ─────────────────────────────────────────────────────────

  it('computes soldeTva = collectée − déductible', async () => {
    const { svc, findMany } = buildService();
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([line({ credit: 20000 })]);  // collectée 20000
    findMany.mockResolvedValueOnce([line({ debit: 8000  })]);   // déductible 8000
    findMany.mockResolvedValueOnce([]);

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    expect(report.soldeTva).toBe(12000);
    expect(report.tvaAPayer).toBe(12000);
    expect(report.creditTva).toBe(0);
  });

  it('returns a credit when deductible exceeds collectée', async () => {
    const { svc, findMany } = buildService();
    findMany.mockResolvedValueOnce([]);
    findMany.mockResolvedValueOnce([line({ credit: 5000  })]);  // collectée 5000
    findMany.mockResolvedValueOnce([line({ debit: 12000 })]);   // déductible 12000
    findMany.mockResolvedValueOnce([]);

    const report = await svc.getCa3(USER_ID, DATE_FROM, DATE_TO);
    expect(report.soldeTva).toBe(-7000);
    expect(report.tvaAPayer).toBe(0);
    expect(report.creditTva).toBe(7000);
  });
});
