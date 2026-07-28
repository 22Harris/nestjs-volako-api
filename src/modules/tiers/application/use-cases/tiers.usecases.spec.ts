import { NotFoundException } from '@nestjs/common';
import { CreateTiersUseCase } from './create-tiers.usecase';
import { DeleteTiersUseCase } from './delete-tiers.usecase';
import { FindTiersUseCase } from './find-tiers.usecase';
import { GetTiersUseCase } from './get-tiers.usecase';
import { UpdateTiersUseCase } from './update-tiers.usecase';
import { GetSoldesUseCase } from './get-soldes.usecase';
import { SearchTiersUseCase } from './search-tiers.usecase';
import { Tiers } from '../../domain/entities/tiers.entity';

const mockRepo = {
  create: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  getSoldes: jest.fn(),
  search: jest.fn(),
};

const USER_ID = 1;

function makeTiers(id = 1): Tiers {
  return { nom: 'Fournisseur A', type: 'FOURNISSEUR', id } as Tiers;
}

beforeEach(() => jest.clearAllMocks());

describe('CreateTiersUseCase', () => {
  it('crée un tiers via le repository', async () => {
    const tiers = makeTiers();
    mockRepo.create.mockResolvedValue(tiers);

    const result = await new CreateTiersUseCase(mockRepo as any).execute({ nom: 'Fournisseur A', type: 'FOURNISSEUR' }, USER_ID);
    expect(result).toBe(tiers);
    expect(mockRepo.create).toHaveBeenCalledWith({ nom: 'Fournisseur A', type: 'FOURNISSEUR' }, USER_ID);
  });
});

describe('DeleteTiersUseCase', () => {
  it('supprime un tiers', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await new DeleteTiersUseCase(mockRepo as any).execute(1, USER_ID);
    expect(mockRepo.delete).toHaveBeenCalledWith(1, USER_ID);
  });
});

describe('FindTiersUseCase', () => {
  it('retourne la liste paginée des tiers', async () => {
    const page = { data: [makeTiers()], total: 1, page: 1, pageSize: 50, totalPages: 1 };
    mockRepo.findAll.mockResolvedValue(page);

    const result = await new FindTiersUseCase(mockRepo as any).execute(USER_ID, 1, 50);
    expect(result).toBe(page);
    expect(mockRepo.findAll).toHaveBeenCalledWith(USER_ID, 1, 50);
  });
});

describe('GetTiersUseCase', () => {
  it('retourne le tiers quand il existe', async () => {
    const tiers = makeTiers(5);
    mockRepo.findById.mockResolvedValue(tiers);

    const result = await new GetTiersUseCase(mockRepo as any).execute(5, USER_ID);
    expect(result).toBe(tiers);
  });

  it('lève NotFoundException si tiers introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(new GetTiersUseCase(mockRepo as any).execute(99, USER_ID))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UpdateTiersUseCase', () => {
  it('met à jour un tiers', async () => {
    const updated = makeTiers();
    mockRepo.update.mockResolvedValue(updated);

    const result = await new UpdateTiersUseCase(mockRepo as any).execute(1, { nom: 'Nouveau nom' }, USER_ID);
    expect(result).toBe(updated);
    expect(mockRepo.update).toHaveBeenCalledWith(1, { nom: 'Nouveau nom' }, USER_ID);
  });
});

describe('GetSoldesUseCase', () => {
  it('retourne les soldes des tiers', async () => {
    const soldes = [{ tiersId: 1, solde: 500 }] as any;
    mockRepo.getSoldes.mockResolvedValue(soldes);

    const result = await new GetSoldesUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(soldes);
    expect(mockRepo.getSoldes).toHaveBeenCalledWith(USER_ID);
  });
});

describe('SearchTiersUseCase', () => {
  it('recherche des tiers par terme', async () => {
    const tiers = [makeTiers()];
    mockRepo.search.mockResolvedValue(tiers);

    const result = await new SearchTiersUseCase(mockRepo as any).execute('four', USER_ID);
    expect(result).toBe(tiers);
    expect(mockRepo.search).toHaveBeenCalledWith('four', USER_ID);
  });
});
