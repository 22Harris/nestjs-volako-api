import { FindOperationsUseCase } from './find_operations.usecase';
import { DeleteOperationUseCase } from './delete_operation.usecase';
import { GetOperationUseCase } from './get_operation.usecase';
import { UpdateOperationUseCase } from './update_operation.usecase';
import { Operation } from '../../domain/operation.entity';
import { OperationType } from '../../interface/types/operation.type';

const mockRepo = {
  findAll: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
};

const USER_ID = 1;

function makeOp(id = 1): Operation {
  return { id, type: OperationType.SALE, date: new Date(), label: 'Vente test' } as Operation;
}

beforeEach(() => jest.clearAllMocks());

// ── Operation entity ───────────────────────────────────────────────────────────

describe('Operation entity', () => {
  it('crée une opération valide', () => {
    const op = new Operation(OperationType.PURCHASE, new Date(), 'Achat matériel');
    expect(op.label).toBe('Achat matériel');
    expect(op.type).toBe(OperationType.PURCHASE);
  });

  it('lève une erreur si libellé vide', () => {
    expect(() => new Operation(OperationType.PURCHASE, new Date(), ''))
      .toThrow('Le libellé de l\'opération est obligatoire');
  });

  it('lève une erreur si type invalide', () => {
    expect(() => new Operation('INVALID' as any, new Date(), 'Test'))
      .toThrow('Type d\'opération invalide');
  });
});

// ── FindOperationsUseCase ──────────────────────────────────────────────────────

describe('FindOperationsUseCase', () => {
  it('retourne les opérations filtrées', async () => {
    const ops = [makeOp(1), makeOp(2)];
    mockRepo.findAll.mockResolvedValue(ops);

    const result = await new FindOperationsUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(ops);
    expect(mockRepo.findAll).toHaveBeenCalledWith(USER_ID, undefined);
  });

  it('transmet le filtre au repository', async () => {
    mockRepo.findAll.mockResolvedValue([]);
    const filter = { type: OperationType.SALE } as any;

    await new FindOperationsUseCase(mockRepo as any).execute(USER_ID, filter);
    expect(mockRepo.findAll).toHaveBeenCalledWith(USER_ID, filter);
  });
});

// ── DeleteOperationUseCase ─────────────────────────────────────────────────────

describe('DeleteOperationUseCase', () => {
  it('supprime une opération', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await new DeleteOperationUseCase(mockRepo as any).execute(1, USER_ID);
    expect(mockRepo.delete).toHaveBeenCalledWith(1, USER_ID);
  });
});

// ── GetOperationUseCase ────────────────────────────────────────────────────────

describe('GetOperationUseCase', () => {
  it('retourne l\'opération par id', async () => {
    const op = makeOp(5);
    mockRepo.findById.mockResolvedValue(op);

    const result = await new GetOperationUseCase(mockRepo as any).execute(5, USER_ID);
    expect(result).toBe(op);
  });

  it('retourne null si introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    expect(await new GetOperationUseCase(mockRepo as any).execute(99, USER_ID)).toBeNull();
  });
});

// ── UpdateOperationUseCase ─────────────────────────────────────────────────────

describe('UpdateOperationUseCase', () => {
  it('met à jour une opération', async () => {
    const updated = makeOp(1);
    mockRepo.update.mockResolvedValue(updated);

    const result = await new UpdateOperationUseCase(mockRepo as any).execute(1, { label: 'Nouveau' }, USER_ID);
    expect(result).toBe(updated);
    expect(mockRepo.update).toHaveBeenCalledWith(1, { label: 'Nouveau' }, USER_ID);
  });
});
