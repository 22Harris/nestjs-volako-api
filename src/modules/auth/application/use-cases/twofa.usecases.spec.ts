import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as otplib from 'otplib';
import { Setup2faUseCase } from './setup-2fa.usecase';
import { Enable2faUseCase } from './enable-2fa.usecase';
import { Disable2faUseCase } from './disable-2fa.usecase';
import { Verify2faUseCase } from './verify-2fa.usecase';
import { Role } from 'src/common/enums/role.enum';

jest.mock('otplib', () => ({
  generateSecret: jest.fn().mockReturnValue('TESTSECRET'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/Volako:test%40example.com?secret=TESTSECRET'),
  verify: jest.fn(),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,QRCODE'),
}));

const mockRepo = {
  findById: jest.fn(),
  setTwoFactorSecret: jest.fn(),
  enableTwoFactor: jest.fn(),
  disableTwoFactor: jest.fn(),
  createRefreshToken: jest.fn(),
};
const mockAuditLog = { log: jest.fn() };
const mockJwtService = { sign: jest.fn().mockReturnValue('jwt-token') };

const USER_ID = 1;

function makeUser(overrides: any = {}) {
  return {
    id: USER_ID,
    name: 'Alice',
    email: 'test@example.com',
    role: Role.DAF,
    isActive: true,
    twoFactorSecret: null,
    twoFactorEnabled: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuditLog.log.mockResolvedValue(undefined);
  mockRepo.setTwoFactorSecret.mockResolvedValue(undefined);
  mockRepo.enableTwoFactor.mockResolvedValue(undefined);
  mockRepo.disableTwoFactor.mockResolvedValue(undefined);
  mockRepo.createRefreshToken.mockResolvedValue(undefined);
});

// ── Setup2faUseCase ────────────────────────────────────────────────────────────

describe('Setup2faUseCase', () => {
  function uc() { return new Setup2faUseCase(mockRepo as any); }

  it('génère secret + QR code et sauvegarde le secret', async () => {
    mockRepo.findById.mockResolvedValue(makeUser());

    const result = await uc().execute(USER_ID);

    expect(result.secret).toBe('TESTSECRET');
    expect(result.qrCodeDataUrl).toContain('data:image/png');
    expect(mockRepo.setTwoFactorSecret).toHaveBeenCalledWith(USER_ID, 'TESTSECRET');
  });

  it('lève NotFoundException si utilisateur introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ForbiddenException pour un rôle non autorisé (ASSISTANT)', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ role: Role.ASSISTANT }));
    await expect(uc().execute(USER_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('autorise le rôle ADMIN', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ role: Role.ADMIN }));
    await expect(uc().execute(USER_ID)).resolves.toBeDefined();
  });
});

// ── Enable2faUseCase ───────────────────────────────────────────────────────────

describe('Enable2faUseCase', () => {
  function uc() { return new Enable2faUseCase(mockRepo as any, mockAuditLog as any); }

  it('active la 2FA avec un code valide', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorSecret: 'TESTSECRET' }));
    (otplib.verify as jest.Mock).mockResolvedValue(true);

    await uc().execute(USER_ID, '123456');
    expect(mockRepo.enableTwoFactor).toHaveBeenCalledWith(USER_ID);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: '2FA_ENABLED' }));
  });

  it('lève NotFoundException si utilisateur introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(USER_ID, '123456')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si aucun secret configuré', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorSecret: null }));
    await expect(uc().execute(USER_ID, '123456')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève BadRequestException si déjà activée', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorSecret: 'SEC', twoFactorEnabled: true }));
    await expect(uc().execute(USER_ID, '123456')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève BadRequestException si code TOTP invalide', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorSecret: 'TESTSECRET' }));
    (otplib.verify as jest.Mock).mockResolvedValue(false);
    await expect(uc().execute(USER_ID, '000000')).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── Disable2faUseCase ──────────────────────────────────────────────────────────

describe('Disable2faUseCase', () => {
  function uc() { return new Disable2faUseCase(mockRepo as any, mockAuditLog as any); }

  it('désactive la 2FA avec un code valide', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorSecret: 'TESTSECRET', twoFactorEnabled: true }));
    (otplib.verify as jest.Mock).mockResolvedValue(true);

    await uc().execute(USER_ID, '123456');
    expect(mockRepo.disableTwoFactor).toHaveBeenCalledWith(USER_ID);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: '2FA_DISABLED' }));
  });

  it('lève BadRequestException si 2FA non activée', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorEnabled: false }));
    await expect(uc().execute(USER_ID, '123456')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève BadRequestException si code invalide', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorSecret: 'TESTSECRET', twoFactorEnabled: true }));
    (otplib.verify as jest.Mock).mockResolvedValue(false);
    await expect(uc().execute(USER_ID, '000000')).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── Verify2faUseCase ───────────────────────────────────────────────────────────

describe('Verify2faUseCase', () => {
  function uc() { return new Verify2faUseCase(mockRepo as any, mockJwtService as any, mockAuditLog as any); }

  it('retourne les tokens après vérification réussie', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorSecret: 'TESTSECRET', twoFactorEnabled: true }));
    (otplib.verify as jest.Mock).mockResolvedValue(true);

    const result = await uc().execute(USER_ID, '123456');
    expect(result.access_token).toBe('jwt-token');
    expect(result.refresh_token).toBeDefined();
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: '2FA_SUCCESS' }));
  });

  it('lève UnauthorizedException si utilisateur introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(USER_ID, '123456')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève UnauthorizedException si code invalide', async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ twoFactorSecret: 'TESTSECRET', twoFactorEnabled: true }));
    (otplib.verify as jest.Mock).mockResolvedValue(false);

    await expect(uc().execute(USER_ID, '000000')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockAuditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: '2FA_FAILED' }));
  });
});
