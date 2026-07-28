import { NotFoundException } from '@nestjs/common';
import { CreateFactureUseCase } from './create-facture.usecase';
import { FindFacturesUseCase } from './find-factures.usecase';
import { GetFactureUseCase } from './get-facture.usecase';
import { DeleteFactureUseCase } from './delete-facture.usecase';
import { UpdateFactureUseCase } from './update-facture.usecase';
import { AddPaiementUseCase } from './add-paiement.usecase';
import { LettrerUseCase } from './lettrer.usecase';
import { Facture } from '../../domain/entities/facture.entity';

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  addPaiement: jest.fn(),
  lettrer: jest.fn(),
};

const USER_ID = 1;

function makeFacture(id = 1): Facture {
  return { id, numero: 'F-001', date: new Date(), montant: 10000, statut: 'EN_ATTENTE', tiersId: 5 } as Facture;
}

beforeEach(() => jest.clearAllMocks());

describe('CreateFactureUseCase', () => {
  it('crée une facture', async () => {
    const f = makeFacture();
    mockRepo.create.mockResolvedValue(f);

    const result = await new CreateFactureUseCase(mockRepo as any).execute({ numero: 'F-001' }, USER_ID);
    expect(result).toBe(f);
    expect(mockRepo.create).toHaveBeenCalledWith({ numero: 'F-001' }, USER_ID);
  });
});

describe('FindFacturesUseCase', () => {
  it('retourne les factures paginées', async () => {
    const page = { data: [makeFacture()], total: 1, page: 1, pageSize: 50, totalPages: 1 };
    mockRepo.findAll.mockResolvedValue(page);

    const result = await new FindFacturesUseCase(mockRepo as any).execute(USER_ID, undefined, 1, 50);
    expect(result).toBe(page);
  });

  it('filtre par tiers', async () => {
    mockRepo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 50, totalPages: 0 });
    await new FindFacturesUseCase(mockRepo as any).execute(USER_ID, 5);
    expect(mockRepo.findAll).toHaveBeenCalledWith(USER_ID, 5, undefined, undefined);
  });
});

describe('GetFactureUseCase', () => {
  it('retourne la facture si elle existe', async () => {
    const f = makeFacture(3);
    mockRepo.findById.mockResolvedValue(f);

    const result = await new GetFactureUseCase(mockRepo as any).execute(3, USER_ID);
    expect(result).toBe(f);
  });

  it('lève NotFoundException si introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(new GetFactureUseCase(mockRepo as any).execute(99, USER_ID))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DeleteFactureUseCase', () => {
  it('supprime une facture', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await new DeleteFactureUseCase(mockRepo as any).execute(1, USER_ID);
    expect(mockRepo.delete).toHaveBeenCalledWith(1, USER_ID);
  });
});

describe('UpdateFactureUseCase', () => {
  it('met à jour une facture', async () => {
    const updated = makeFacture();
    mockRepo.update.mockResolvedValue(updated);

    const result = await new UpdateFactureUseCase(mockRepo as any).execute(1, { statut: 'PAYEE' }, USER_ID);
    expect(result).toBe(updated);
  });
});

describe('AddPaiementUseCase', () => {
  it('ajoute un paiement à une facture', async () => {
    const f = makeFacture();
    mockRepo.addPaiement.mockResolvedValue(f);

    const result = await new AddPaiementUseCase(mockRepo as any).execute(1, { montant: 5000 }, USER_ID);
    expect(result).toBe(f);
    expect(mockRepo.addPaiement).toHaveBeenCalledWith(1, { montant: 5000 }, USER_ID);
  });
});

describe('LettrerUseCase', () => {
  it('lettre une facture', async () => {
    mockRepo.lettrer.mockResolvedValue(undefined);
    await new LettrerUseCase(mockRepo as any).execute(1, 'A', USER_ID);
    expect(mockRepo.lettrer).toHaveBeenCalledWith(1, 'A', USER_ID);
  });
});
