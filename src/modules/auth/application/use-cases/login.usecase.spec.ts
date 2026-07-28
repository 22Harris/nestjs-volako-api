import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.usecase';
import * as bcrypt from 'bcrypt';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  findByEmail:        jest.fn(),
  createRefreshToken: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed.jwt.token'),
};

const mockAuditLog = {
  log: jest.fn(),
};

function buildUseCase(): LoginUseCase {
  return new LoginUseCase(
    mockRepo as any,
    mockJwtService as any,
    mockAuditLog as any,
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeUser(overrides: Partial<{ isActive: boolean; password: string }> = {}) {
  const password = overrides.password ?? 'correct-password';
  const hashed   = await bcrypt.hash(password, 10);
  return {
    id:       1,
    name:     'Test User',
    email:    'test@volako.com',
    password: hashed,
    role:     'COMPTABLE',
    isActive: overrides.isActive ?? true,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.createRefreshToken.mockResolvedValue(undefined);
    mockAuditLog.log.mockResolvedValue(undefined);
  });

  it('retourne access_token, refresh_token et user en cas de succès', async () => {
    const user = await makeUser();
    mockRepo.findByEmail.mockResolvedValue(user);

    const result = await buildUseCase().execute('test@volako.com', 'correct-password');

    expect('access_token' in result).toBe(true);
    if (!('access_token' in result)) return;
    expect(result.access_token).toBe('signed.jwt.token');
    expect(result.refresh_token).toHaveLength(80);
    expect(result.user).toMatchObject({ id: 1, email: 'test@volako.com', role: 'COMPTABLE' });
    expect(mockRepo.createRefreshToken).toHaveBeenCalledTimes(1);
  });

  it('lève UnauthorizedException si email introuvable', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    await expect(
      buildUseCase().execute('unknown@volako.com', 'any'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockAuditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_FAILED' }),
    );
    expect(mockRepo.createRefreshToken).not.toHaveBeenCalled();
  });

  it('lève UnauthorizedException si compte désactivé', async () => {
    const user = await makeUser({ isActive: false });
    mockRepo.findByEmail.mockResolvedValue(user);

    await expect(
      buildUseCase().execute('test@volako.com', 'correct-password'),
    ).rejects.toThrow('Compte désactivé');

    expect(mockAuditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_FAILED', details: 'Compte désactivé' }),
    );
  });

  it('lève UnauthorizedException si mot de passe incorrect', async () => {
    const user = await makeUser();
    mockRepo.findByEmail.mockResolvedValue(user);

    await expect(
      buildUseCase().execute('test@volako.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockRepo.createRefreshToken).not.toHaveBeenCalled();
  });

  it('journalise LOGIN_SUCCESS en cas de succès', async () => {
    const user = await makeUser();
    mockRepo.findByEmail.mockResolvedValue(user);

    await buildUseCase().execute('test@volako.com', 'correct-password', '127.0.0.1');

    expect(mockAuditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_SUCCESS', ip: '127.0.0.1', userId: 1 }),
    );
  });

  it('signe le JWT avec les données utilisateur', async () => {
    const user = await makeUser();
    mockRepo.findByEmail.mockResolvedValue(user);

    await buildUseCase().execute('test@volako.com', 'correct-password');

    expect(mockJwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 1, email: 'test@volako.com', role: 'COMPTABLE' }),
    );
  });
});
