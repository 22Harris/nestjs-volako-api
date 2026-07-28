import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginUseCase } from './login.usecase';
import { LogoutUseCase } from './logout.usecase';
import { ChangePasswordUseCase } from './change-password.usecase';
import { RegisterUseCase } from './register.usecase';
import { User } from '../../domain/entities/user.entity';
import { Role } from 'src/common/enums/role.enum';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  createRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
  updatePassword: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt'),
};

const mockAuditLog = {
  log: jest.fn(),
};

const mockInitPcg = {
  execute: jest.fn(),
};

const USER_ID = 1;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    name: 'Alice',
    email: 'alice@example.com',
    password: bcrypt.hashSync('secret', 1),
    role: Role.DAF,
    isActive: true,
    ...overrides,
  } as User;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuditLog.log.mockResolvedValue(undefined);
  mockRepo.createRefreshToken.mockResolvedValue(undefined);
  mockInitPcg.execute.mockResolvedValue(undefined);
});

// ── LoginUseCase ──────────────────────────────────────────────────────────────

describe('LoginUseCase', () => {
  function uc() {
    return new LoginUseCase(mockRepo as any, mockJwtService as any, mockAuditLog as any);
  }

  it('retourne access_token et refresh_token pour des identifiants valides', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser());

    const result = await uc().execute('alice@example.com', 'secret');
    expect('access_token' in result).toBe(true);
    if (!('access_token' in result)) return;
    expect(result.access_token).toBe('mock-jwt');
    expect(result.refresh_token).toBeDefined();
    expect(result.user.email).toBe('alice@example.com');
  });

  it('lève UnauthorizedException si email introuvable', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    await expect(uc().execute('no@no.com', 'secret')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LOGIN_FAILED' }));
  });

  it('lève UnauthorizedException si compte désactivé', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser({ isActive: false }));
    await expect(uc().execute('alice@example.com', 'secret')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lève UnauthorizedException si mot de passe incorrect', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser());
    await expect(uc().execute('alice@example.com', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('log LOGIN_SUCCESS après connexion réussie', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser());
    await uc().execute('alice@example.com', 'secret');
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LOGIN_SUCCESS' }));
  });
});

// ── LogoutUseCase ─────────────────────────────────────────────────────────────

describe('LogoutUseCase', () => {
  function uc() {
    return new LogoutUseCase(mockRepo as any, mockAuditLog as any);
  }

  it('supprime le refresh token et logue LOGOUT', async () => {
    mockRepo.findRefreshToken.mockResolvedValue({ userId: USER_ID });
    mockRepo.deleteRefreshToken.mockResolvedValue(undefined);

    await uc().execute('some-token');
    expect(mockRepo.deleteRefreshToken).toHaveBeenCalledWith('some-token');
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LOGOUT' }));
  });

  it('ne fait rien si le token n\'existe pas', async () => {
    mockRepo.findRefreshToken.mockResolvedValue(null);
    await uc().execute('invalid-token');
    expect(mockRepo.deleteRefreshToken).not.toHaveBeenCalled();
    expect(mockAuditLog.log).not.toHaveBeenCalled();
  });
});

// ── ChangePasswordUseCase ─────────────────────────────────────────────────────

describe('ChangePasswordUseCase', () => {
  function uc() {
    return new ChangePasswordUseCase(mockRepo as any, mockAuditLog as any);
  }

  it('change le mot de passe avec les bons identifiants', async () => {
    mockRepo.findById.mockResolvedValue(makeUser());
    mockRepo.updatePassword.mockResolvedValue(undefined);

    await uc().execute(USER_ID, 'secret', 'newSecret');
    expect(mockRepo.updatePassword).toHaveBeenCalledWith(USER_ID, expect.any(String));
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'PASSWORD_CHANGED' }));
  });

  it('lève NotFoundException si utilisateur introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99, 'secret', 'new')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève UnauthorizedException si mot de passe actuel incorrect', async () => {
    mockRepo.findById.mockResolvedValue(makeUser());
    await expect(uc().execute(USER_ID, 'wrong', 'new')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

// ── RegisterUseCase ───────────────────────────────────────────────────────────

describe('RegisterUseCase', () => {
  function uc() {
    return new RegisterUseCase(
      mockRepo as any,
      mockJwtService as any,
      mockAuditLog as any,
      mockInitPcg as any,
    );
  }

  it('crée un utilisateur et retourne les tokens', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    const newUser = makeUser({ id: 2 });
    mockRepo.create.mockResolvedValue(newUser);

    const result = await uc().execute('Alice', 'alice@example.com', 'secret');
    expect(result.access_token).toBe('mock-jwt');
    expect(result.refresh_token).toBeDefined();
    expect(mockInitPcg.execute).toHaveBeenCalledWith(2);
  });

  it('lève ConflictException si email déjà utilisé', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser());
    await expect(uc().execute('Alice', 'alice@example.com', 'secret'))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
