import { CreateEvenementUseCase } from './create-evenement.usecase';
import { FindEvenementsUseCase } from './find-evenements.usecase';
import { GetEvenementUseCase } from './get-evenement.usecase';
import { UpdateEvenementUseCase } from './update-evenement.usecase';
import { DeleteEvenementUseCase } from './delete-evenement.usecase';
import { MarquerPayeUseCase } from './marquer-paye.usecase';

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  marquerPaye: jest.fn(),
};

const USER_ID = 1;

function makeEvent(id = 1) {
  return { id, label: 'Réunion', date: new Date(), montant: 1000, paye: false } as any;
}

beforeEach(() => jest.clearAllMocks());

describe('CreateEvenementUseCase', () => {
  it('crée un événement', async () => {
    const ev = makeEvent();
    mockRepo.create.mockResolvedValue(ev);

    const result = await new CreateEvenementUseCase(mockRepo as any).execute({ label: 'Réunion' } as any, USER_ID);
    expect(result).toBe(ev);
  });
});

describe('FindEvenementsUseCase', () => {
  it('retourne la liste des événements', async () => {
    const list = [makeEvent()];
    mockRepo.findAll.mockResolvedValue(list);

    const result = await new FindEvenementsUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(list);
  });
});

describe('GetEvenementUseCase', () => {
  it('retourne un événement par id', async () => {
    const ev = makeEvent(3);
    mockRepo.findById.mockResolvedValue(ev);

    const result = await new GetEvenementUseCase(mockRepo as any).execute(3, USER_ID);
    expect(result).toBe(ev);
  });

  it('retourne null si introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    expect(await new GetEvenementUseCase(mockRepo as any).execute(99, USER_ID)).toBeNull();
  });
});

describe('UpdateEvenementUseCase', () => {
  it('met à jour un événement', async () => {
    const updated = makeEvent();
    mockRepo.update.mockResolvedValue(updated);

    const result = await new UpdateEvenementUseCase(mockRepo as any).execute(1, { label: 'Modifié' }, USER_ID);
    expect(result).toBe(updated);
  });
});

describe('DeleteEvenementUseCase', () => {
  it('supprime un événement', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await new DeleteEvenementUseCase(mockRepo as any).execute(1, USER_ID);
    expect(mockRepo.delete).toHaveBeenCalledWith(1, USER_ID);
  });
});

describe('MarquerPayeUseCase', () => {
  it('marque un événement comme payé', async () => {
    const res = { updated: makeEvent(), next: null };
    mockRepo.marquerPaye.mockResolvedValue(res);

    const result = await new MarquerPayeUseCase(mockRepo as any).execute(1, USER_ID);
    expect(result).toBe(res);
    expect(mockRepo.marquerPaye).toHaveBeenCalledWith(1, USER_ID);
  });
});
