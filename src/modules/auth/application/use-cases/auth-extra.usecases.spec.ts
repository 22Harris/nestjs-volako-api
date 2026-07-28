import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RefreshUseCase } from './refresh.usecase';
import { UpdateProfileUseCase } from './update-profile.usecase';
import { User } from '../../domain/entities/user.entity';
import { Role } from 'src/common/enums/role.enum';

const mockRepo = {
  findRefreshToken: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  deleteRefreshToken: jest.fn(),
  updateProfile: jest.fn(),
};

const mockJwtService = { sign: jest.fn().mockReturnValue('new-jwt') };
const mockAuditLog = { log: jest.fn() };

const USER_ID = 1;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID, name: 'Alice', email: 'alice@example.com',
    password: 'hash', role: Role.DAF, isActive: true,
    ...overrides,
  } as User;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuditLog.log.mockResolvedValue(undefined);
});

// ── RefreshUseCase ─────────────────────────────────────────────────────────────

describe('RefreshUseCase', () => {
  function uc() {
    return new RefreshUseCase(mockRepo as any, mockJwtService as any, mockAuditLog as any);
  }

  it('retourne un nouveau access_token si refresh token valide', async () => {
    const futureDate = new Date(Date.now() + 60_000);
    mockRepo.findRefreshToken.mockResolvedValue({ userId: USER_ID, expiresAt: futureDate });
    mockRepo.findById.mockResolvedValue(makeUser());

    const result = await uc().execute('valid-token');
    expect(result.access_token).toBe('new-jwt');
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TOKEN_REFRESH' }));
  });

  it('lève UnauthorizedException si token introuvable', async () => {
    mockRepo.findRefreshToken.mockResolvedValue(null);
    await expect(uc().execute('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TOKEN_REFRESH_FAILED' }));
  });

  it('lève UnauthorizedException si token expiré et le supprime', async () => {
    const pastDate = new Date(Date.now() - 60_000);
    mockRepo.findRefreshToken.mockResolvedValue({ userId: USER_ID, expiresAt: pastDate });
    mockRepo.deleteRefreshToken.mockResolvedValue(undefined);

    await expect(uc().execute('expired-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockRepo.deleteRefreshToken).toHaveBeenCalledWith('expired-token');
  });

  it('lève UnauthorizedException si utilisateur introuvable', async () => {
    const futureDate = new Date(Date.now() + 60_000);
    mockRepo.findRefreshToken.mockResolvedValue({ userId: USER_ID, expiresAt: futureDate });
    mockRepo.findById.mockResolvedValue(null);

    await expect(uc().execute('orphan-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

// ── UpdateProfileUseCase ───────────────────────────────────────────────────────

describe('UpdateProfileUseCase', () => {
  function uc() {
    return new UpdateProfileUseCase(mockRepo as any, mockAuditLog as any);
  }

  it('met à jour le profil', async () => {
    mockRepo.findById.mockResolvedValue(makeUser());
    mockRepo.updateProfile.mockResolvedValue({ id: USER_ID, name: 'Alice B', email: 'alice@example.com' });

    const result = await uc().execute(USER_ID, 'Alice B', 'alice@example.com');
    expect(result.name).toBe('Alice B');
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROFILE_UPDATED' }));
  });

  it('lève NotFoundException si utilisateur introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99, 'X', 'x@x.com')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ConflictException si nouvel email déjà utilisé par quelqu\'un d\'autre', async () => {
    mockRepo.findById.mockResolvedValue(makeUser());
    mockRepo.findByEmail.mockResolvedValue(makeUser({ id: 99, email: 'taken@example.com' }));

    await expect(uc().execute(USER_ID, 'Alice', 'taken@example.com'))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('autorise si le nouvel email est le même que l\'ancien', async () => {
    mockRepo.findById.mockResolvedValue(makeUser());
    mockRepo.updateProfile.mockResolvedValue({ id: USER_ID, name: 'Alice', email: 'alice@example.com' });

    await expect(uc().execute(USER_ID, 'Alice', 'alice@example.com')).resolves.toBeDefined();
    expect(mockRepo.findByEmail).not.toHaveBeenCalled();
  });
});
