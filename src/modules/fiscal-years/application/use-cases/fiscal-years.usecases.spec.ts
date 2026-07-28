import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateFiscalYearUseCase } from './create-fiscal-year.usecase';
import { FindFiscalYearsUseCase } from './find-fiscal-years.usecase';
import { GetFiscalYearUseCase } from './get-fiscal-year.usecase';
import { FiscalYear, FiscalYearStatus } from '../../domain/entities/fiscal-year.entity';

const mockRepo = {
  findByAnnee: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
};

const USER_ID = 1;

function makeFY(annee = 2025): FiscalYear {
  return { id: 1, annee, statut: FiscalYearStatus.OUVERT, userId: USER_ID } as FiscalYear;
}

beforeEach(() => jest.clearAllMocks());

// ── CreateFiscalYearUseCase ────────────────────────────────────────────────────

describe('CreateFiscalYearUseCase', () => {
  it('crée l\'exercice s\'il n\'existe pas encore', async () => {
    mockRepo.findByAnnee.mockResolvedValue(null);
    const fy = makeFY(2025);
    mockRepo.create.mockResolvedValue(fy);

    const result = await new CreateFiscalYearUseCase(mockRepo as any).execute(2025, USER_ID);
    expect(result).toBe(fy);
    expect(mockRepo.create).toHaveBeenCalledWith(2025, USER_ID);
  });

  it('lève ConflictException si l\'exercice existe déjà', async () => {
    mockRepo.findByAnnee.mockResolvedValue(makeFY(2025));
    await expect(new CreateFiscalYearUseCase(mockRepo as any).execute(2025, USER_ID))
      .rejects.toBeInstanceOf(ConflictException);
  });
});

// ── FindFiscalYearsUseCase ─────────────────────────────────────────────────────

describe('FindFiscalYearsUseCase', () => {
  it('retourne la liste des exercices', async () => {
    const list = [makeFY(2024), makeFY(2025)];
    mockRepo.findAll.mockResolvedValue(list);

    const result = await new FindFiscalYearsUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(list);
    expect(mockRepo.findAll).toHaveBeenCalledWith(USER_ID);
  });
});

// ── GetFiscalYearUseCase ───────────────────────────────────────────────────────

describe('GetFiscalYearUseCase', () => {
  it('retourne l\'exercice par id', async () => {
    const fy = makeFY(2025);
    mockRepo.findById.mockResolvedValue(fy);

    const result = await new GetFiscalYearUseCase(mockRepo as any).execute(1, USER_ID);
    expect(result).toBe(fy);
  });

  it('lève NotFoundException si l\'exercice est introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(new GetFiscalYearUseCase(mockRepo as any).execute(99, USER_ID))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
