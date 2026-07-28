import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserUseCase } from './create_user.usecase';
import { FindUsersUseCase } from './find_users.usecase';
import { ToggleActiveUseCase } from './toggle_active.usecase';
import { UpdateUserUseCase } from './update_user.usecase';
import { Role } from 'src/common/enums/role.enum';

const mockRepo = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  countByRole: jest.fn(),
  setActive: jest.fn(),
  update: jest.fn(),
};

const mockAuditLog = { log: jest.fn() };

const USER_ID = 1;

function makeUserProfile(overrides: any = {}) {
  return {
    id: USER_ID,
    name: 'Alice',
    email: 'alice@example.com',
    role: Role.DAF,
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuditLog.log.mockResolvedValue(undefined);
});

// ── CreateUserUseCase ──────────────────────────────────────────────────────────

describe('CreateUserUseCase', () => {
  function uc() {
    return new CreateUserUseCase(mockRepo as any, mockAuditLog as any);
  }

  it('crée un utilisateur si email libre', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    const profile = makeUserProfile();
    mockRepo.create.mockResolvedValue(profile);

    const result = await uc().execute({ name: 'Alice', email: 'alice@example.com', password: 'secret', role: Role.DAF });
    expect(result).toBe(profile);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_CREATED' }));
  });

  it('lève ConflictException si email déjà utilisé', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUserProfile());
    await expect(uc().execute({ name: 'Bob', email: 'alice@example.com', password: 'x', role: Role.ASSISTANT }))
      .rejects.toBeInstanceOf(ConflictException);
  });
});

// ── FindUsersUseCase ───────────────────────────────────────────────────────────

describe('FindUsersUseCase', () => {
  it('retourne tous les utilisateurs', async () => {
    const users = [makeUserProfile(), makeUserProfile({ id: 2, email: 'bob@example.com' })];
    mockRepo.findAll.mockResolvedValue(users);

    const result = await new FindUsersUseCase(mockRepo as any).execute();
    expect(result).toBe(users);
  });
});

// ── ToggleActiveUseCase ────────────────────────────────────────────────────────

describe('ToggleActiveUseCase', () => {
  function uc() {
    return new ToggleActiveUseCase(mockRepo as any, mockAuditLog as any);
  }

  it('désactive un utilisateur actif', async () => {
    mockRepo.findById.mockResolvedValue(makeUserProfile({ role: Role.DAF }));
    const updated = makeUserProfile({ isActive: false });
    mockRepo.setActive.mockResolvedValue(updated);

    const result = await uc().execute(USER_ID);
    expect(result.isActive).toBe(false);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_DEACTIVATED' }));
  });

  it('active un utilisateur inactif', async () => {
    mockRepo.findById.mockResolvedValue(makeUserProfile({ isActive: false, role: Role.DAF }));
    const updated = makeUserProfile({ isActive: true });
    mockRepo.setActive.mockResolvedValue(updated);

    const result = await uc().execute(USER_ID);
    expect(result.isActive).toBe(true);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_ACTIVATED' }));
  });

  it('lève NotFoundException si utilisateur introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si désactivation du dernier ADMIN', async () => {
    mockRepo.findById.mockResolvedValue(makeUserProfile({ role: Role.ADMIN, isActive: true }));
    mockRepo.countByRole.mockResolvedValue(1);
    await expect(uc().execute(USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('autorise la désactivation d\'un ADMIN si plusieurs admins', async () => {
    mockRepo.findById.mockResolvedValue(makeUserProfile({ role: Role.ADMIN, isActive: true }));
    mockRepo.countByRole.mockResolvedValue(2);
    const updated = makeUserProfile({ isActive: false });
    mockRepo.setActive.mockResolvedValue(updated);

    const result = await uc().execute(USER_ID);
    expect(result.isActive).toBe(false);
  });
});

// ── UpdateUserUseCase ──────────────────────────────────────────────────────────

describe('UpdateUserUseCase', () => {
  function uc() {
    return new UpdateUserUseCase(mockRepo as any, mockAuditLog as any);
  }

  it('met à jour un utilisateur', async () => {
    mockRepo.findById.mockResolvedValue(makeUserProfile());
    const updated = makeUserProfile({ name: 'Alice Dupont' });
    mockRepo.update.mockResolvedValue(updated);

    const result = await uc().execute(USER_ID, { name: 'Alice Dupont' });
    expect(result).toBe(updated);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_UPDATED' }));
  });

  it('lève NotFoundException si utilisateur introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99, { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ConflictException si nouvel email déjà utilisé', async () => {
    mockRepo.findById.mockResolvedValue(makeUserProfile());
    mockRepo.findByEmail.mockResolvedValue(makeUserProfile({ id: 99, email: 'other@example.com' }));

    await expect(uc().execute(USER_ID, { email: 'other@example.com' }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('ne vérifie pas l\'email si inchangé', async () => {
    mockRepo.findById.mockResolvedValue(makeUserProfile());
    const updated = makeUserProfile();
    mockRepo.update.mockResolvedValue(updated);

    await uc().execute(USER_ID, { email: 'alice@example.com' });
    expect(mockRepo.findByEmail).not.toHaveBeenCalled();
  });
});
