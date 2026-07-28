import { ConflictException, NotFoundException } from '@nestjs/common';
import { CloseFiscalYearUseCase } from './close-fiscal-year.usecase';
import { FiscalYear, FiscalYearStatus } from '../../domain/entities/fiscal-year.entity';
import { Account } from '../../../accounts/domain/entities/account.entity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFiscalYear(annee: number, statut: FiscalYearStatus = FiscalYearStatus.OUVERT): FiscalYear {
  return { annee, statut, userId: 1, id: 1 } as unknown as FiscalYear;
}

function makeAccount(code: string, id: number): Account {
  return { code, name: `Compte ${code}`, accountClass: Number(code[0]), id } as unknown as Account;
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFiscalYearRepo = {
  findByAnnee: jest.fn(),
  close: jest.fn(),
};

const mockJournalEntryRepo = {
  getAccountBalances: jest.fn(),
  createJournalEntry: jest.fn(),
};

const mockAccountRepo = {
  findByCode: jest.fn(),
  create: jest.fn(),
};

const mockPeriodeLocksRepo = {
  isLocked: jest.fn(),
  lock: jest.fn(),
};

const mockAuditLog = {
  log: jest.fn(),
};

function buildUseCase(): CloseFiscalYearUseCase {
  return new CloseFiscalYearUseCase(
    mockFiscalYearRepo as any,
    mockJournalEntryRepo as any,
    mockAccountRepo as any,
    mockPeriodeLocksRepo as any,
    mockAuditLog as any,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CloseFiscalYearUseCase', () => {
  const ANNEE = 2023;
  const USER_ID = 1;
  const compte120 = makeAccount('120', 120);

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no balances, account 120 found, no locked periods, close succeeds
    mockFiscalYearRepo.findByAnnee.mockResolvedValue(makeFiscalYear(ANNEE));
    mockFiscalYearRepo.close.mockResolvedValue(makeFiscalYear(ANNEE, FiscalYearStatus.CLOTURE));
    mockJournalEntryRepo.getAccountBalances.mockResolvedValue([]);
    mockJournalEntryRepo.createJournalEntry.mockResolvedValue({ id: 99 });
    mockAccountRepo.findByCode.mockResolvedValue(compte120);
    mockPeriodeLocksRepo.isLocked.mockResolvedValue(false);
    mockPeriodeLocksRepo.lock.mockResolvedValue(undefined);
    mockAuditLog.log.mockResolvedValue(undefined);
  });

  // ── Error paths ─────────────────────────────────────────────────────────────

  it('throws NotFoundException when the fiscal year does not exist', async () => {
    mockFiscalYearRepo.findByAnnee.mockResolvedValue(null);
    await expect(buildUseCase().execute(ANNEE, USER_ID)).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when the fiscal year is already closed', async () => {
    mockFiscalYearRepo.findByAnnee.mockResolvedValue(makeFiscalYear(ANNEE, FiscalYearStatus.CLOTURE));
    await expect(buildUseCase().execute(ANNEE, USER_ID)).rejects.toThrow(ConflictException);
  });

  // ── Happy path: no charges / no produits ────────────────────────────────────

  it('does not create closing entries when there are no charges or produits', async () => {
    await buildUseCase().execute(ANNEE, USER_ID);
    // createJournalEntry should only be called for the opening entry (if any balance accounts)
    // since balances are empty, no opening entry either
    expect(mockJournalEntryRepo.createJournalEntry).not.toHaveBeenCalled();
  });

  // ── Charges closing entry ────────────────────────────────────────────────────

  it('creates a charges closing entry when class-6 accounts have a net debit balance', async () => {
    mockJournalEntryRepo.getAccountBalances
      .mockResolvedValueOnce([
        // year balances: one charge account with net debit
        { accountId: 601, accountCode: '601000', totalDebit: 50000, totalCredit: 0 },
      ])
      .mockResolvedValueOnce([]); // cumulative (for opening entry)

    const uc = buildUseCase();
    await uc.execute(ANNEE, USER_ID);

    // One call for closing charges entry
    expect(mockJournalEntryRepo.createJournalEntry).toHaveBeenCalledTimes(1);
    const [entry] = mockJournalEntryRepo.createJournalEntry.mock.calls[0];
    expect(entry.label).toContain(`Clôture des charges`);
    expect(entry.lines.some((l: any) => l.accountId === compte120.id && l.debit === 50000)).toBe(true);
    expect(entry.lines.some((l: any) => l.accountId === 601 && l.credit === 50000)).toBe(true);
  });

  it('creates a produits closing entry when class-7 accounts have a net credit balance', async () => {
    mockJournalEntryRepo.getAccountBalances
      .mockResolvedValueOnce([
        { accountId: 701, accountCode: '701000', totalDebit: 0, totalCredit: 80000 },
      ])
      .mockResolvedValueOnce([]);

    await buildUseCase().execute(ANNEE, USER_ID);

    expect(mockJournalEntryRepo.createJournalEntry).toHaveBeenCalledTimes(1);
    const [entry] = mockJournalEntryRepo.createJournalEntry.mock.calls[0];
    expect(entry.label).toContain('Clôture des produits');
    expect(entry.lines.some((l: any) => l.accountId === compte120.id && l.credit === 80000)).toBe(true);
    expect(entry.lines.some((l: any) => l.accountId === 701 && l.debit === 80000)).toBe(true);
  });

  it('creates both closing entries when charges and produits both exist', async () => {
    mockJournalEntryRepo.getAccountBalances
      .mockResolvedValueOnce([
        { accountId: 601, accountCode: '601000', totalDebit: 30000, totalCredit: 0 },
        { accountId: 701, accountCode: '701000', totalDebit: 0, totalCredit: 50000 },
      ])
      .mockResolvedValueOnce([]);

    await buildUseCase().execute(ANNEE, USER_ID);

    expect(mockJournalEntryRepo.createJournalEntry).toHaveBeenCalledTimes(2);
    const labels = mockJournalEntryRepo.createJournalEntry.mock.calls.map((c: any) => c[0].label as string);
    expect(labels.some(l => l.includes('charges'))).toBe(true);
    expect(labels.some(l => l.includes('produits'))).toBe(true);
  });

  // ── Opening entry (Report à nouveau) ────────────────────────────────────────

  it('creates a Report à nouveau entry for balance accounts (classes 1–5) in cumulative balances', async () => {
    mockJournalEntryRepo.getAccountBalances
      .mockResolvedValueOnce([]) // year balances (no charges/produits)
      .mockResolvedValueOnce([
        // cumulative: one debit balance on class 1
        { accountId: 101, accountCode: '101000', totalDebit: 100000, totalCredit: 0 },
        // one credit balance on class 4
        { accountId: 401, accountCode: '401000', totalDebit: 0, totalCredit: 100000 },
      ]);

    await buildUseCase().execute(ANNEE, USER_ID);

    expect(mockJournalEntryRepo.createJournalEntry).toHaveBeenCalledTimes(1);
    const [openingEntry] = mockJournalEntryRepo.createJournalEntry.mock.calls[0];
    expect(openingEntry.label).toContain('Report à nouveau');
    expect(openingEntry.date.getFullYear()).toBe(ANNEE + 1);
    // Entry must be balanced
    const totalDebit  = openingEntry.lines.reduce((s: number, l: any) => s + l.debit,  0);
    const totalCredit = openingEntry.lines.reduce((s: number, l: any) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
  });

  it('ignores class 6 and 7 accounts in the Report à nouveau (they are closed)', async () => {
    mockJournalEntryRepo.getAccountBalances
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        // class 6 & 7 should be excluded from opening entry
        { accountId: 601, accountCode: '601000', totalDebit: 50000, totalCredit: 0 },
        { accountId: 701, accountCode: '701000', totalDebit: 0, totalCredit: 50000 },
      ]);

    await buildUseCase().execute(ANNEE, USER_ID);

    // No balance accounts → no opening entry
    expect(mockJournalEntryRepo.createJournalEntry).not.toHaveBeenCalled();
  });

  // ── Period locking ───────────────────────────────────────────────────────────

  it('locks all 12 months of the fiscal year', async () => {
    await buildUseCase().execute(ANNEE, USER_ID);
    expect(mockPeriodeLocksRepo.lock).toHaveBeenCalledTimes(12);
    for (let m = 1; m <= 12; m++) {
      expect(mockPeriodeLocksRepo.lock).toHaveBeenCalledWith(ANNEE, m, USER_ID);
    }
  });

  it('skips already-locked periods', async () => {
    // Only months 1–3 are not yet locked
    mockPeriodeLocksRepo.isLocked.mockImplementation((_y: number, mois: number) =>
      Promise.resolve(mois > 3),
    );
    await buildUseCase().execute(ANNEE, USER_ID);
    expect(mockPeriodeLocksRepo.lock).toHaveBeenCalledTimes(3);
  });

  // ── Fiscal year status ───────────────────────────────────────────────────────

  it('calls fiscalYearRepo.close and returns the closed fiscal year', async () => {
    const result = await buildUseCase().execute(ANNEE, USER_ID);
    expect(mockFiscalYearRepo.close).toHaveBeenCalledWith(ANNEE, USER_ID);
    expect(result.statut).toBe(FiscalYearStatus.CLOTURE);
  });

  it('logs FISCAL_YEAR_CLOSED in the audit log', async () => {
    await buildUseCase().execute(ANNEE, USER_ID);
    expect(mockAuditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FISCAL_YEAR_CLOSED', userId: USER_ID }),
    );
  });

  // ── findOrCreateAccount ──────────────────────────────────────────────────────

  it('creates account 120 when it does not exist', async () => {
    mockAccountRepo.findByCode.mockRejectedValue(new Error('Not found'));
    mockAccountRepo.create.mockResolvedValue(makeAccount('120', 999));
    // produits > charges → bénéfice → compte 120
    mockJournalEntryRepo.getAccountBalances
      .mockResolvedValueOnce([
        { accountId: 701, accountCode: '701000', totalDebit: 0, totalCredit: 20000 },
        { accountId: 601, accountCode: '601000', totalDebit: 10000, totalCredit: 0 },
      ])
      .mockResolvedValueOnce([]);

    await buildUseCase().execute(ANNEE, USER_ID);

    expect(mockAccountRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: '120' }),
      USER_ID,
    );
  });
});
