import { ConflictException } from '@nestjs/common';
import { LockPeriodUseCase } from './lock-period.usecase';
import { UnlockPeriodUseCase } from './unlock-period.usecase';
import { FindPeriodeLocksUseCase } from './find-periode-locks.usecase';

const mockRepo = {
  isLocked: jest.fn(),
  lock: jest.fn(),
  unlock: jest.fn(),
  findAll: jest.fn(),
};

const USER_ID = 1;

beforeEach(() => jest.clearAllMocks());

describe('LockPeriodUseCase', () => {
  it('verrouille une période non verrouillée', async () => {
    mockRepo.isLocked.mockResolvedValue(false);
    const lock = { id: 1, annee: 2025, mois: 6, userId: USER_ID } as any;
    mockRepo.lock.mockResolvedValue(lock);

    const result = await new LockPeriodUseCase(mockRepo as any).execute(2025, 6, USER_ID);
    expect(result).toBe(lock);
    expect(mockRepo.lock).toHaveBeenCalledWith(2025, 6, USER_ID);
  });

  it('lève ConflictException si déjà verrouillée', async () => {
    mockRepo.isLocked.mockResolvedValue(true);
    await expect(new LockPeriodUseCase(mockRepo as any).execute(2025, 6, USER_ID))
      .rejects.toBeInstanceOf(ConflictException);
  });
});

describe('UnlockPeriodUseCase', () => {
  it('déverrouille une période', async () => {
    mockRepo.unlock.mockResolvedValue(undefined);
    await new UnlockPeriodUseCase(mockRepo as any).execute(1, USER_ID);
    expect(mockRepo.unlock).toHaveBeenCalledWith(1, USER_ID);
  });
});

describe('FindPeriodeLocksUseCase', () => {
  it('retourne la liste des verrous', async () => {
    const locks = [{ id: 1, annee: 2025, mois: 6, userId: USER_ID }] as any;
    mockRepo.findAll.mockResolvedValue(locks);

    const result = await new FindPeriodeLocksUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(locks);
    expect(mockRepo.findAll).toHaveBeenCalledWith(USER_ID);
  });
});
