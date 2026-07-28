import { NotFoundException } from '@nestjs/common';
import { CompteBank } from '../../domain/entities/compte-bank.entity';
import type { CompteBankRepository } from '../ports/compte-bank.repository.interface';
import type { Psd2Provider, PsdTransaction } from '../ports/psd2-provider.interface';
import type { RapprochementRepository } from '../../../rapprochement/application/ports/rapprochement.repository.interface';
import { EnregistrerCompteBankUseCase } from './enregistrer-compte-bank.usecase';
import { ListerComptesBankUseCase } from './lister-comptes-bank.usecase';
import { SupprimerCompteBankUseCase } from './supprimer-compte-bank.usecase';
import { InitierAutorisationUseCase } from './initier-autorisation.usecase';
import { SynchroniserTransactionsUseCase } from './synchroniser-transactions.usecase';

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeCompte(overrides: Partial<{ tokenExpired: boolean }> = {}): CompteBank {
  const expiresAt = overrides.tokenExpired ? new Date(Date.now() - 3600_000) : new Date(Date.now() + 3600_000);
  return new CompteBank('Compte BNP', 'FR7630006000011234567890189', 'bnp', 'tok_abc', true, 'ref_xyz', expiresAt, undefined, 1, 42);
}

function mockCompteBankRepo(overrides: Partial<CompteBankRepository> = {}): CompteBankRepository {
  return {
    create:               jest.fn().mockResolvedValue(makeCompte()),
    findAll:              jest.fn().mockResolvedValue([makeCompte()]),
    findById:             jest.fn().mockResolvedValue(makeCompte()),
    updateTokens:         jest.fn().mockResolvedValue(undefined),
    updateDerniereSync:   jest.fn().mockResolvedValue(undefined),
    delete:               jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as any;
}

const MOCK_TRANSACTIONS: PsdTransaction[] = [
  { date: new Date('2026-01-10'), libelle: 'Virement ABC', montant: 150000, reference: 'VIR-001' },
  { date: new Date('2026-01-12'), libelle: 'Prélèvement EDF', montant: -18500 },
];

function mockProvider(overrides: Partial<Psd2Provider> = {}): Psd2Provider {
  return {
    buildAuthUrl:        jest.fn().mockReturnValue('https://bank.example.com/auth?state=abc'),
    exchangeCode:        jest.fn().mockResolvedValue({ accessToken: 'tok_new', refreshToken: 'ref_new', expiresAt: new Date(Date.now() + 3600_000) }),
    refreshAccessToken:  jest.fn().mockResolvedValue({ accessToken: 'tok_refreshed', refreshToken: 'ref_refreshed' }),
    getTransactions:     jest.fn().mockResolvedValue(MOCK_TRANSACTIONS),
    ...overrides,
  } as any;
}

function mockRapprochementRepo(): RapprochementRepository {
  return {
    createReleve: jest.fn().mockResolvedValue({ id: 99, nom: 'test', lignes: [] }),
  } as any;
}

// ── CompteBank.tokenExpired ──────────────────────────────────────────────────

describe('CompteBank.tokenExpired', () => {
  it('returns false when token has not expired', () => {
    expect(makeCompte({ tokenExpired: false }).tokenExpired).toBe(false);
  });

  it('returns true when token is past expiry', () => {
    expect(makeCompte({ tokenExpired: true }).tokenExpired).toBe(true);
  });

  it('returns false when tokenExpiresAt is undefined', () => {
    const c = new CompteBank('x', 'FR00', 'mock', 'tok');
    expect(c.tokenExpired).toBe(false);
  });
});

// ── InitierAutorisationUseCase ────────────────────────────────────────────────

describe('InitierAutorisationUseCase', () => {
  it('returns an authUrl and a state', () => {
    const svc = new InitierAutorisationUseCase(mockProvider());
    const result = svc.execute('https://app.example.com/callback');
    expect(result.authUrl).toContain('https://bank.example.com');
    expect(result.state).toBeTruthy();
    expect(result.state).toHaveLength(32); // 16 bytes hex
  });

  it('generates a different state each call', () => {
    const svc = new InitierAutorisationUseCase(mockProvider());
    const r1 = svc.execute('https://app.example.com/callback');
    const r2 = svc.execute('https://app.example.com/callback');
    expect(r1.state).not.toBe(r2.state);
  });
});

// ── EnregistrerCompteBankUseCase ──────────────────────────────────────────────

describe('EnregistrerCompteBankUseCase', () => {
  it('exchanges code for tokens and saves the account', async () => {
    const repo = mockCompteBankRepo();
    const provider = mockProvider();
    const svc = new EnregistrerCompteBankUseCase(repo, provider);
    await svc.execute({ nom: 'BNP', iban: 'FR76 3000 6000 0112 3456 7890 189', provider: 'bnp', code: 'auth_code', redirectUri: 'https://app/cb' }, 42);
    expect(provider.exchangeCode).toHaveBeenCalledWith('auth_code', 'https://app/cb');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ iban: 'FR7630006000011234567890189', accessToken: 'tok_new' }),
      42,
    );
  });

  it('strips spaces from IBAN', async () => {
    const repo = mockCompteBankRepo();
    const svc = new EnregistrerCompteBankUseCase(repo, mockProvider());
    await svc.execute({ nom: 'BNP', iban: 'FR76 3000 6000 01 1234', provider: 'bnp', code: 'c', redirectUri: 'r' }, 1);
    const [[saved]] = (repo.create as jest.Mock).mock.calls;
    expect(saved.iban).toBe('FR7630006000011234');
  });
});

// ── ListerComptesBankUseCase ──────────────────────────────────────────────────

describe('ListerComptesBankUseCase', () => {
  it('delegates to repo.findAll', async () => {
    const repo = mockCompteBankRepo();
    const result = await new ListerComptesBankUseCase(repo).execute(42);
    expect(repo.findAll).toHaveBeenCalledWith(42);
    expect(result).toHaveLength(1);
  });
});

// ── SupprimerCompteBankUseCase ────────────────────────────────────────────────

describe('SupprimerCompteBankUseCase', () => {
  it('soft-deletes an existing account', async () => {
    const repo = mockCompteBankRepo();
    await new SupprimerCompteBankUseCase(repo).execute(1, 42);
    expect(repo.delete).toHaveBeenCalledWith(1, 42);
  });

  it('throws NotFoundException when account not found', async () => {
    const repo = mockCompteBankRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(new SupprimerCompteBankUseCase(repo).execute(99, 42)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── SynchroniserTransactionsUseCase ──────────────────────────────────────────

describe('SynchroniserTransactionsUseCase', () => {
  it('throws NotFoundException when account not found', async () => {
    const repo = mockCompteBankRepo({ findById: jest.fn().mockResolvedValue(null) });
    const svc = new SynchroniserTransactionsUseCase(repo, mockProvider(), mockRapprochementRepo());
    await expect(svc.execute(99, 42)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns zero transactions when provider returns empty list', async () => {
    const provider = mockProvider({ getTransactions: jest.fn().mockResolvedValue([]) });
    const svc = new SynchroniserTransactionsUseCase(mockCompteBankRepo(), provider, mockRapprochementRepo());
    const result = await svc.execute(1, 42);
    expect(result.transactions).toBe(0);
    expect(result.releveId).toBe(0);
  });

  it('creates a ReleveImport and returns the count', async () => {
    const rapproRepo = mockRapprochementRepo();
    const svc = new SynchroniserTransactionsUseCase(mockCompteBankRepo(), mockProvider(), rapproRepo);
    const result = await svc.execute(1, 42);
    expect(result.transactions).toBe(2);
    expect(result.releveId).toBe(99);
    expect(rapproRepo.createReleve).toHaveBeenCalledWith(
      expect.objectContaining({ lignes: expect.arrayContaining([expect.objectContaining({ libelle: 'Virement ABC' })]) }),
      42,
    );
  });

  it('refreshes expired token before fetching transactions', async () => {
    const expiredCompte = makeCompte({ tokenExpired: true });
    const repo = mockCompteBankRepo({ findById: jest.fn().mockResolvedValue(expiredCompte) });
    const provider = mockProvider();
    await new SynchroniserTransactionsUseCase(repo, provider, mockRapprochementRepo()).execute(1, 42);
    expect(provider.refreshAccessToken).toHaveBeenCalledWith('ref_xyz');
    expect(repo.updateTokens).toHaveBeenCalledWith(1, 'tok_refreshed', 'ref_refreshed', undefined);
  });

  it('updates derniereSync after successful sync', async () => {
    const repo = mockCompteBankRepo();
    await new SynchroniserTransactionsUseCase(repo, mockProvider(), mockRapprochementRepo()).execute(1, 42);
    expect(repo.updateDerniereSync).toHaveBeenCalledWith(1, expect.any(Date));
  });
});
