import { BadRequestException } from '@nestjs/common';
import { ImportCsvEcrituresUseCase } from './import-csv-ecritures.usecase';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import type { PeriodeLocksRepository } from '../../../periode-locks/application/ports/periode-locks.repository.interface';

function csv(...lines: string[]): Buffer {
  return Buffer.from(['date,label,journalId,accountId,debit,credit', ...lines].join('\n'), 'utf-8');
}

function mockRepo(overrides: Partial<JournalEntryRepository> = {}): JournalEntryRepository {
  return {
    createJournalEntry: jest.fn().mockResolvedValue({}),
    findJournalEntries: jest.fn(),
    getJournalById: jest.fn(),
    updateLabelOfJournalEntry: jest.fn(),
    deleteJournalEntry: jest.fn(),
    nextPieceNumber: jest.fn(),
    getAccountBalances: jest.fn(),
    lettrerLignes: jest.fn(),
    deletterLignes: jest.fn(),
    getEntryMeta: jest.fn(),
    updateStatut: jest.fn(),
    getUnletteredLines: jest.fn(),
    getLinesForAccount: jest.fn(),
    ...overrides,
  } as unknown as JournalEntryRepository;
}

function mockLocks(locked = false): PeriodeLocksRepository {
  return { isLocked: jest.fn().mockResolvedValue(locked) } as unknown as PeriodeLocksRepository;
}

function makeSvc(repo?: Partial<JournalEntryRepository>, locked = false): ImportCsvEcrituresUseCase {
  const svc = new ImportCsvEcrituresUseCase(mockRepo(repo), mockLocks(locked));
  return svc;
}

// ── Happy path ─────────────────────────────────────────────────────────────

describe('ImportCsvEcrituresUseCase', () => {
  it('imports a single balanced entry', async () => {
    const svc = makeSvc();
    const result = await svc.execute(
      csv('2026-01-15,Achat,1,606000,12000,0', '2026-01-15,Achat,1,401000,0,12000'),
      1,
    );
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('imports multiple distinct entries', async () => {
    const svc = makeSvc();
    const result = await svc.execute(
      csv(
        '2026-01-15,Achat,1,606000,12000,0',
        '2026-01-15,Achat,1,401000,0,12000',
        '2026-01-20,Vente,,411000,15000,0',
        '2026-01-20,Vente,,706000,0,15000',
      ),
      1,
    );
    expect(result.imported).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('groups rows with same date + label into one entry', async () => {
    const createSpy = jest.fn().mockResolvedValue({});
    const svc = makeSvc({ createJournalEntry: createSpy });
    await svc.execute(
      csv(
        '2026-01-15,Salaires,,641000,100000,0',
        '2026-01-15,Salaires,,431000,0,80000',
        '2026-01-15,Salaires,,431100,0,20000',
      ),
      1,
    );
    expect(createSpy).toHaveBeenCalledTimes(1);
    const [entry] = (createSpy as jest.Mock).mock.calls[0];
    expect(entry.lines).toHaveLength(3);
  });

  it('passes codeTva to the journal line', async () => {
    const createSpy = jest.fn().mockResolvedValue({});
    const svc = makeSvc({ createJournalEntry: createSpy });
    const buf = Buffer.from(
      'date,label,accountId,debit,credit,codeTva\n' +
      '2026-02-01,TVA,706000,0,10000,NORMAL_20\n' +
      '2026-02-01,TVA,411000,10000,0,\n',
      'utf-8',
    );
    await svc.execute(buf, 1);
    const [entry] = (createSpy as jest.Mock).mock.calls[0];
    const tvaLine = entry.lines.find((l: any) => l.credit === 10000);
    expect(tvaLine.codeTva).toBe('NORMAL_20');
  });

  // ── Validation errors ──────────────────────────────────────────────────────

  it('throws BadRequestException when CSV has fewer than 2 lines', async () => {
    const svc = makeSvc();
    await expect(svc.execute(Buffer.from('date,label,accountId,debit,credit'), 1))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException for missing required column', async () => {
    const svc = makeSvc();
    const buf = Buffer.from('date,label,accountId,debit\nrow', 'utf-8');
    await expect(svc.execute(buf, 1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records error for invalid date format', async () => {
    const svc = makeSvc();
    const result = await svc.execute(
      csv('15/01/2026,Achat,1,606000,12000,0', '15/01/2026,Achat,1,401000,0,12000'),
      1,
    );
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Date invalide');
  });

  it('records error when debit and credit are both zero', async () => {
    const svc = makeSvc();
    const result = await svc.execute(
      csv('2026-01-15,Achat,1,606000,0,0', '2026-01-15,Achat,1,401000,0,0'),
      1,
    );
    expect(result.errors.some(e => e.message.includes('0'))).toBe(true);
  });

  it('records error when a line has both debit and credit', async () => {
    const svc = makeSvc();
    const result = await svc.execute(
      csv('2026-01-15,Achat,1,606000,500,500', '2026-01-15,Achat,1,401000,0,1000'),
      1,
    );
    expect(result.errors.some(e => e.message.toLowerCase().includes('simultanément'))).toBe(true);
  });

  it('skips an unbalanced entry and reports the error', async () => {
    const svc = makeSvc();
    const result = await svc.execute(
      csv('2026-01-15,Achat,1,606000,12000,0', '2026-01-15,Achat,1,401000,0,11000'),
      1,
    );
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors.some(e => e.message.includes('déséquilibrée'))).toBe(true);
  });

  it('skips entry in a locked period', async () => {
    const svc = makeSvc({}, true);
    const result = await svc.execute(
      csv('2026-01-15,Achat,1,606000,12000,0', '2026-01-15,Achat,1,401000,0,12000'),
      1,
    );
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors.some(e => e.message.includes('verrouillée'))).toBe(true);
  });

  it('records error for invalid codeTva value', async () => {
    const svc = makeSvc();
    const buf = Buffer.from(
      'date,label,accountId,debit,credit,codeTva\n' +
      '2026-02-01,TVA,706000,0,10000,TVA_INVALIDE\n',
      'utf-8',
    );
    const result = await svc.execute(buf, 1);
    expect(result.errors.some(e => e.message.includes('codeTva invalide'))).toBe(true);
  });

  it('handles CRLF line endings', async () => {
    const svc = makeSvc();
    const buf = Buffer.from(
      'date,label,accountId,debit,credit\r\n' +
      '2026-01-15,Achat,606000,12000,0\r\n' +
      '2026-01-15,Achat,401000,0,12000\r\n',
      'utf-8',
    );
    const result = await svc.execute(buf, 1);
    expect(result.imported).toBe(1);
  });

  it('handles quoted fields with commas', async () => {
    const svc = makeSvc();
    const buf = Buffer.from(
      'date,label,accountId,debit,credit\n' +
      '2026-01-15,"Achat, matériel",606000,12000,0\n' +
      '2026-01-15,"Achat, matériel",401000,0,12000\n',
      'utf-8',
    );
    const result = await svc.execute(buf, 1);
    expect(result.imported).toBe(1);
  });

  it('imports valid rows and collects errors for invalid rows independently', async () => {
    const svc = makeSvc();
    const result = await svc.execute(
      csv(
        'bad-date,Achat,1,606000,12000,0',   // error
        '2026-01-20,Vente,,411000,15000,0',   // ok group start
        '2026-01-20,Vente,,706000,0,15000',   // ok group end
      ),
      1,
    );
    expect(result.imported).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
