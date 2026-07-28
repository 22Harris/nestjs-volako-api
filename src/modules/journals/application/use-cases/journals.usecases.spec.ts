import { FindJournalsUseCase } from './find-journals.usecase';
import { GetOrCreateJournalUseCase } from './get-or-create-journal.usecase';

const mockRepo = {
  findAll: jest.fn(),
  getOrCreate: jest.fn(),
};

const USER_ID = 1;

beforeEach(() => jest.clearAllMocks());

describe('FindJournalsUseCase', () => {
  it('retourne la liste des journaux', async () => {
    const journals = [{ id: 1, type: 'OD', userId: USER_ID }] as any;
    mockRepo.findAll.mockResolvedValue(journals);

    const result = await new FindJournalsUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(journals);
    expect(mockRepo.findAll).toHaveBeenCalledWith(USER_ID);
  });
});

describe('GetOrCreateJournalUseCase', () => {
  it('retourne ou crée un journal par type', async () => {
    const journal = { id: 2, type: 'ACHATS', userId: USER_ID } as any;
    mockRepo.getOrCreate.mockResolvedValue(journal);

    const result = await new GetOrCreateJournalUseCase(mockRepo as any).execute('ACHATS' as any, USER_ID);
    expect(result).toBe(journal);
    expect(mockRepo.getOrCreate).toHaveBeenCalledWith('ACHATS', USER_ID);
  });
});
