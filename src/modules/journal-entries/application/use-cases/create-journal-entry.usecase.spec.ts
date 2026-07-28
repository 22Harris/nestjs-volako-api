import { ForbiddenException } from '@nestjs/common';
import { CreateJournalEntryUseCase } from './create-journal-entry.usecase';
import { JournalEntry } from '../../domain/entities/journal-entries.entity';
import { CreateJournalEntryDto } from '../../interface/dtos/create-journal-entry.dto';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPeriodeLocksRepo = {
  isLocked: jest.fn(),
};

const mockJournalEntryRepo = {
  createJournalEntry: jest.fn(),
};

function buildUseCase(): CreateJournalEntryUseCase {
  return new CreateJournalEntryUseCase(
    mockJournalEntryRepo as any,
    mockPeriodeLocksRepo as any,
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDto(date = '2025-03-15'): CreateJournalEntryDto {
  const dto = new CreateJournalEntryDto();
  dto.date  = date;
  dto.label = 'Achat fournitures';
  dto.lines = [
    { accountId: 10, debit: 1000, credit: 0 } as any,
    { accountId: 20, debit: 0,    credit: 1000 } as any,
  ];
  return dto;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateJournalEntryUseCase', () => {
  const USER_ID = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crée l\'écriture si la période est ouverte', async () => {
    const savedEntry = { id: 1, date: new Date('2025-03-15'), label: 'Achat fournitures', lines: [] } as unknown as JournalEntry;
    mockPeriodeLocksRepo.isLocked.mockResolvedValue(false);
    mockJournalEntryRepo.createJournalEntry.mockResolvedValue(savedEntry);

    const result = await buildUseCase().execute(makeDto(), undefined, USER_ID);

    expect(mockPeriodeLocksRepo.isLocked).toHaveBeenCalledWith(2025, 3, USER_ID);
    expect(mockJournalEntryRepo.createJournalEntry).toHaveBeenCalledTimes(1);
    expect(result).toBe(savedEntry);
  });

  it('lève ForbiddenException si la période est verrouillée', async () => {
    mockPeriodeLocksRepo.isLocked.mockResolvedValue(true);

    await expect(
      buildUseCase().execute(makeDto('2025-03-15'), undefined, USER_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockJournalEntryRepo.createJournalEntry).not.toHaveBeenCalled();
  });

  it('extrait correctement l\'année et le mois de la date', async () => {
    mockPeriodeLocksRepo.isLocked.mockResolvedValue(false);
    mockJournalEntryRepo.createJournalEntry.mockResolvedValue({} as JournalEntry);

    await buildUseCase().execute(makeDto('2024-12-01'), undefined, USER_ID);

    expect(mockPeriodeLocksRepo.isLocked).toHaveBeenCalledWith(2024, 12, USER_ID);
  });

  it('transmet l\'operationId du paramètre en priorité sur le DTO', async () => {
    const dto = makeDto();
    dto.operationId = 99;
    mockPeriodeLocksRepo.isLocked.mockResolvedValue(false);
    mockJournalEntryRepo.createJournalEntry.mockResolvedValue({} as JournalEntry);

    await buildUseCase().execute(dto, 42, USER_ID);

    expect(mockJournalEntryRepo.createJournalEntry).toHaveBeenCalledWith(
      expect.any(JournalEntry),
      42,
      USER_ID,
      undefined,
    );
  });

  it('utilise l\'operationId du DTO si aucun paramètre fourni', async () => {
    const dto = makeDto();
    dto.operationId = 99;
    mockPeriodeLocksRepo.isLocked.mockResolvedValue(false);
    mockJournalEntryRepo.createJournalEntry.mockResolvedValue({} as JournalEntry);

    await buildUseCase().execute(dto, undefined, USER_ID);

    expect(mockJournalEntryRepo.createJournalEntry).toHaveBeenCalledWith(
      expect.any(JournalEntry),
      99,
      USER_ID,
      undefined,
    );
  });
});
