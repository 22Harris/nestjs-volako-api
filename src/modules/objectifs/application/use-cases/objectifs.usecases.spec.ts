import { CreateObjectifUseCase } from './create-objectif.usecase';
import { FindObjectifsUseCase } from './find-objectifs.usecase';
import { GetObjectifUseCase } from './get-objectif.usecase';
import { UpdateObjectifUseCase } from './update-objectif.usecase';
import { DeleteObjectifUseCase } from './delete-objectif.usecase';
import { VersementUseCase } from './versement.usecase';

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  versement: jest.fn(),
};

const USER_ID = 1;

function makeObjectif(id = 1) {
  return { id, label: 'Épargne', cible: 100000, montantAtteint: 0 } as any;
}

beforeEach(() => jest.clearAllMocks());

describe('CreateObjectifUseCase', () => {
  it('crée un objectif', async () => {
    const obj = makeObjectif();
    mockRepo.create.mockResolvedValue(obj);

    const result = await new CreateObjectifUseCase(mockRepo as any).execute({ label: 'Épargne' }, USER_ID);
    expect(result).toBe(obj);
  });
});

describe('FindObjectifsUseCase', () => {
  it('retourne les objectifs', async () => {
    const list = [makeObjectif()];
    mockRepo.findAll.mockResolvedValue(list);

    const result = await new FindObjectifsUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(list);
  });
});

describe('GetObjectifUseCase', () => {
  it('retourne un objectif par id', async () => {
    const obj = makeObjectif(3);
    mockRepo.findById.mockResolvedValue(obj);

    expect(await new GetObjectifUseCase(mockRepo as any).execute(3, USER_ID)).toBe(obj);
  });

  it('retourne null si introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    expect(await new GetObjectifUseCase(mockRepo as any).execute(99, USER_ID)).toBeNull();
  });
});

describe('UpdateObjectifUseCase', () => {
  it('met à jour un objectif', async () => {
    const updated = makeObjectif();
    mockRepo.update.mockResolvedValue(updated);

    const result = await new UpdateObjectifUseCase(mockRepo as any).execute(1, { label: 'Modifié' }, USER_ID);
    expect(result).toBe(updated);
  });
});

describe('DeleteObjectifUseCase', () => {
  it('supprime un objectif', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await new DeleteObjectifUseCase(mockRepo as any).execute(1, USER_ID);
    expect(mockRepo.delete).toHaveBeenCalledWith(1, USER_ID);
  });
});

describe('VersementUseCase', () => {
  it('enregistre un versement', async () => {
    const updated = makeObjectif();
    updated.montantAtteint = 5000;
    mockRepo.versement.mockResolvedValue(updated);

    const result = await new VersementUseCase(mockRepo as any).execute(1, 5000, USER_ID);
    expect(result).toBe(updated);
    expect(mockRepo.versement).toHaveBeenCalledWith(1, 5000, USER_ID);
  });
});
