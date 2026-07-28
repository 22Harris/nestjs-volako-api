import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RapprocherLigneUseCase } from './rapprocher-ligne.usecase';
import { DerapprocherLigneUseCase } from './derapprocher-ligne.usecase';
import { GetRelevesUseCase } from './get-releves.usecase';
import { GetReleveUseCase } from './get-releve.usecase';
import { DeleteReleveUseCase } from './delete-releve.usecase';

const mockRepo = {
  findLigneReleve: jest.fn(),
  rapprocherLigne: jest.fn(),
  derapprocherLigne: jest.fn(),
  findReleves: jest.fn(),
  findReleve: jest.fn(),
  deleteReleve: jest.fn(),
};

const USER_ID = 1;

beforeEach(() => jest.clearAllMocks());

// ── RapprocherLigneUseCase ─────────────────────────────────────────────────────

describe('RapprocherLigneUseCase', () => {
  function uc() { return new RapprocherLigneUseCase(mockRepo as any); }

  it('rapproche une ligne non rapprochée', async () => {
    mockRepo.findLigneReleve.mockResolvedValue({ id: 1, rapprochee: false });
    const result = { id: 1, rapprochee: true } as any;
    mockRepo.rapprocherLigne.mockResolvedValue(result);

    expect(await uc().execute(1, 10)).toBe(result);
    expect(mockRepo.rapprocherLigne).toHaveBeenCalledWith(1, 10);
  });

  it('lève NotFoundException si ligne introuvable', async () => {
    mockRepo.findLigneReleve.mockResolvedValue(null);
    await expect(uc().execute(99, 10)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si déjà rapprochée', async () => {
    mockRepo.findLigneReleve.mockResolvedValue({ id: 1, rapprochee: true });
    await expect(uc().execute(1, 10)).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── DerapprocherLigneUseCase ───────────────────────────────────────────────────

describe('DerapprocherLigneUseCase', () => {
  function uc() { return new DerapprocherLigneUseCase(mockRepo as any); }

  it('dérapproche une ligne existante', async () => {
    mockRepo.findLigneReleve.mockResolvedValue({ id: 1, rapprochee: true });
    const result = { id: 1, rapprochee: false } as any;
    mockRepo.derapprocherLigne.mockResolvedValue(result);

    expect(await uc().execute(1)).toBe(result);
  });

  it('lève NotFoundException si ligne introuvable', async () => {
    mockRepo.findLigneReleve.mockResolvedValue(null);
    await expect(uc().execute(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── GetRelevesUseCase ──────────────────────────────────────────────────────────

describe('GetRelevesUseCase', () => {
  it('retourne tous les relevés de l\'utilisateur', async () => {
    const releves = [{ id: 1 }] as any;
    mockRepo.findReleves.mockResolvedValue(releves);

    const result = await new GetRelevesUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(releves);
    expect(mockRepo.findReleves).toHaveBeenCalledWith(USER_ID);
  });
});

// ── GetReleveUseCase ───────────────────────────────────────────────────────────

describe('GetReleveUseCase', () => {
  it('retourne le relevé par id', async () => {
    const releve = { id: 5 } as any;
    mockRepo.findReleve.mockResolvedValue(releve);

    expect(await new GetReleveUseCase(mockRepo as any).execute(5, USER_ID)).toBe(releve);
  });

  it('lève NotFoundException si introuvable', async () => {
    mockRepo.findReleve.mockResolvedValue(null);
    await expect(new GetReleveUseCase(mockRepo as any).execute(99, USER_ID))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── DeleteReleveUseCase ────────────────────────────────────────────────────────

describe('DeleteReleveUseCase', () => {
  it('supprime un relevé', async () => {
    mockRepo.deleteReleve.mockResolvedValue(undefined);
    await new DeleteReleveUseCase(mockRepo as any).execute(1, USER_ID);
    expect(mockRepo.deleteReleve).toHaveBeenCalledWith(1, USER_ID);
  });
});
