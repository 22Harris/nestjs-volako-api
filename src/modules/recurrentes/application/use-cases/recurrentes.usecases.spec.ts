import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EcritureRecurrente } from '../../domain/entities/ecriture-recurrente.entity';
import type { RecurrentesRepository } from '../ports/recurrentes.repository.interface';
import { CreerRecurrenteUseCase } from './creer-recurrente.usecase';
import { ListerRecurrentesUseCase } from './lister-recurrentes.usecase';
import { ModifierRecurrenteUseCase } from './modifier-recurrente.usecase';
import { SupprimerRecurrenteUseCase } from './supprimer-recurrente.usecase';
import { ExecuterRecurrentesUseCase } from './executer-recurrentes.usecase';
import type { CreateJournalEntryUseCase } from '../../../journal-entries/application/use-cases/create-journal-entry.usecase';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const LIGNES = [
  { accountId: 606000, debit: 10000, credit: 0 },
  { accountId: 401000, debit: 0, credit: 10000 },
];

function makeEntity(): EcritureRecurrente {
  return new EcritureRecurrente(
    'Loyer mensuel',
    'MENSUEL',
    new Date('2026-02-01'),
    LIGNES,
    true,
    undefined,
    1,
    42,
  );
}

function mockRepo(overrides: Partial<RecurrentesRepository> = {}): RecurrentesRepository {
  return {
    create:              jest.fn().mockResolvedValue(makeEntity()),
    findAll:             jest.fn().mockResolvedValue([makeEntity()]),
    findById:            jest.fn().mockResolvedValue(makeEntity()),
    update:              jest.fn().mockResolvedValue(makeEntity()),
    delete:              jest.fn().mockResolvedValue(undefined),
    findDues:            jest.fn().mockResolvedValue([]),
    updateNextExecution: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as any;
}

function mockCreateEntry(): CreateJournalEntryUseCase {
  return { execute: jest.fn().mockResolvedValue({}) } as any;
}

// ── EcritureRecurrente.nextExecution ──────────────────────────────────────────

describe('EcritureRecurrente.nextExecution', () => {
  const base = new Date('2026-01-15');

  it('QUOTIDIEN +1 day', () => {
    expect(EcritureRecurrente.nextExecution('QUOTIDIEN', base).toISOString().slice(0, 10)).toBe('2026-01-16');
  });

  it('HEBDOMADAIRE +7 days', () => {
    expect(EcritureRecurrente.nextExecution('HEBDOMADAIRE', base).toISOString().slice(0, 10)).toBe('2026-01-22');
  });

  it('MENSUEL +1 month', () => {
    expect(EcritureRecurrente.nextExecution('MENSUEL', base).toISOString().slice(0, 10)).toBe('2026-02-15');
  });

  it('TRIMESTRIEL +3 months', () => {
    expect(EcritureRecurrente.nextExecution('TRIMESTRIEL', base).toISOString().slice(0, 10)).toBe('2026-04-15');
  });

  it('ANNUEL +1 year', () => {
    expect(EcritureRecurrente.nextExecution('ANNUEL', base).toISOString().slice(0, 10)).toBe('2027-01-15');
  });
});

// ── CreerRecurrenteUseCase ────────────────────────────────────────────────────

describe('CreerRecurrenteUseCase', () => {
  it('creates a balanced entry', async () => {
    const repo = mockRepo();
    const svc = new CreerRecurrenteUseCase(repo);
    await svc.execute({ label: 'Loyer', frequence: 'MENSUEL', prochainExecution: '2026-02-01', lignes: LIGNES }, 42);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('throws BadRequestException when lignes are unbalanced', async () => {
    const svc = new CreerRecurrenteUseCase(mockRepo());
    const lignes = [
      { accountId: 606000, debit: 10000, credit: 0 },
      { accountId: 401000, debit: 0, credit: 9000 },
    ];
    await expect(
      svc.execute({ label: 'Loyer', frequence: 'MENSUEL', prochainExecution: '2026-02-01', lignes }, 42),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── ListerRecurrentesUseCase ─────────────────────────────────────────────────

describe('ListerRecurrentesUseCase', () => {
  it('delegates to repo.findAll', async () => {
    const repo = mockRepo();
    const svc = new ListerRecurrentesUseCase(repo);
    const result = await svc.execute(42);
    expect(repo.findAll).toHaveBeenCalledWith(42);
    expect(result).toHaveLength(1);
  });
});

// ── ModifierRecurrenteUseCase ─────────────────────────────────────────────────

describe('ModifierRecurrenteUseCase', () => {
  it('updates an existing entry', async () => {
    const repo = mockRepo();
    const svc = new ModifierRecurrenteUseCase(repo);
    await svc.execute(1, { label: 'Nouveau label' }, 42);
    expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ label: 'Nouveau label' }), 42);
  });

  it('throws NotFoundException when entry does not belong to user', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(null) });
    const svc = new ModifierRecurrenteUseCase(repo);
    await expect(svc.execute(99, { label: 'x' }, 42)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when new lignes are unbalanced', async () => {
    const repo = mockRepo();
    const svc = new ModifierRecurrenteUseCase(repo);
    const lignes = [
      { accountId: 606000, debit: 10000, credit: 0 },
      { accountId: 401000, debit: 0, credit: 1 },
    ];
    await expect(svc.execute(1, { lignes }, 42)).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── SupprimerRecurrenteUseCase ────────────────────────────────────────────────

describe('SupprimerRecurrenteUseCase', () => {
  it('deletes an existing entry', async () => {
    const repo = mockRepo();
    const svc = new SupprimerRecurrenteUseCase(repo);
    await svc.execute(1, 42);
    expect(repo.delete).toHaveBeenCalledWith(1, 42);
  });

  it('throws NotFoundException when entry not found', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(null) });
    const svc = new SupprimerRecurrenteUseCase(repo);
    await expect(svc.execute(99, 42)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── ExecuterRecurrentesUseCase ────────────────────────────────────────────────

describe('ExecuterRecurrentesUseCase', () => {
  it('returns zero executed when no entries are due', async () => {
    const repo = mockRepo({ findDues: jest.fn().mockResolvedValue([]) });
    const svc = new ExecuterRecurrentesUseCase(repo, mockCreateEntry());
    const result = await svc.execute();
    expect(result.executed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('executes a due entry and advances prochainExecution', async () => {
    const due = makeEntity();
    const repo = mockRepo({ findDues: jest.fn().mockResolvedValue([due]) });
    const createEntry = mockCreateEntry();
    const svc = new ExecuterRecurrentesUseCase(repo, createEntry);
    const result = await svc.execute();
    expect(result.executed).toBe(1);
    expect(createEntry.execute).toHaveBeenCalledTimes(1);
    expect(repo.updateNextExecution).toHaveBeenCalledWith(
      1,
      expect.any(Date),
    );
  });

  it('records error and continues when createEntry fails', async () => {
    const due = makeEntity();
    const repo = mockRepo({ findDues: jest.fn().mockResolvedValue([due]) });
    const createEntry = { execute: jest.fn().mockRejectedValue(new Error('période verrouillée')) } as unknown as CreateJournalEntryUseCase;
    const svc = new ExecuterRecurrentesUseCase(repo, createEntry);
    const result = await svc.execute();
    expect(result.executed).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('verrouillée');
  });

  it('updates prochainExecution to the correct next date (MENSUEL)', async () => {
    const due = makeEntity(); // prochainExecution = 2026-02-01, frequence = MENSUEL
    const updateSpy = jest.fn().mockResolvedValue(undefined);
    const repo = mockRepo({ findDues: jest.fn().mockResolvedValue([due]), updateNextExecution: updateSpy });
    await new ExecuterRecurrentesUseCase(repo, mockCreateEntry()).execute();
    const [, nextDate] = (updateSpy as jest.Mock).mock.calls[0];
    expect((nextDate as Date).toISOString().slice(0, 10)).toBe('2026-03-01');
  });
});
