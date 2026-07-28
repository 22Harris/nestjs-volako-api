import { InitPcgUseCase } from './init_pcg.usecase';
import { Account } from '../../domain/entities/account.entity';

const mockRepo = {
  findAccounts: jest.fn(),
  create: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('InitPcgUseCase', () => {
  it('crée les comptes absents et ignore les existants', async () => {
    // Simuler 2 comptes déjà présents (codes réels du PCG)
    mockRepo.findAccounts.mockResolvedValue([
      { code: '101' },
      { code: '1011' },
    ]);
    mockRepo.create.mockResolvedValue({} as Account);

    const uc = new InitPcgUseCase(mockRepo as any);
    const result = await uc.execute(1);

    expect(result.skipped).toBe(2);
    expect(result.created).toBeGreaterThan(0);
    expect(mockRepo.create).toHaveBeenCalledTimes(result.created);
  });

  it('crée tous les comptes si aucun n\'existe', async () => {
    mockRepo.findAccounts.mockResolvedValue([]);
    mockRepo.create.mockResolvedValue({} as Account);

    const result = await new InitPcgUseCase(mockRepo as any).execute(1);

    expect(result.skipped).toBe(0);
    expect(result.created).toBeGreaterThan(0);
  });

  it('ne crée rien si tous les comptes existent déjà', async () => {
    // D'abord, récupérer le total PCG en faisant une passe avec un repo vide
    mockRepo.findAccounts.mockResolvedValue([]);
    mockRepo.create.mockResolvedValue({} as Account);
    const { created: total } = await new InitPcgUseCase(mockRepo as any).execute(1);

    // Maintenant simuler que tous ces comptes existent
    const allCalls = mockRepo.create.mock.calls.map((c: any) => ({ code: (c[0] as Account).code }));
    mockRepo.findAccounts.mockResolvedValue(allCalls);
    mockRepo.create.mockClear();

    const result = await new InitPcgUseCase(mockRepo as any).execute(1);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(total);
  });
});
