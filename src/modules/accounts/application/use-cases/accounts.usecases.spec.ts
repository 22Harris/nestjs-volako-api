import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateAccountUseCase } from './create_account.usecase';
import { DeleteAccountUseCase } from './delete_account.usecase';
import { FindAccountsUseCase } from './find_accounts.usecase';
import { FindByCodeUseCase } from './find_by_code.usecase';
import { GetAccountByAccountId } from './get_account_by_accountID.usecase';
import { SearchAccountUseCase } from './search_account.usecase';
import { UpdateAccountUseCase } from './update_account.usecase';
import { Account } from '../../domain/entities/account.entity';

const mockRepo = {
  create: jest.fn(),
  getAccount: jest.fn(),
  deleteAccount: jest.fn(),
  findAccounts: jest.fn(),
  findByCode: jest.fn(),
  searchAccount: jest.fn(),
  updateAccount: jest.fn(),
};

const USER_ID = 1;

function makeAccount(code: string, id = 1, isSystem = false): Account {
  return { code, name: `Compte ${code}`, account_class: Number(code[0]), id, isSystem } as Account;
}

beforeEach(() => jest.clearAllMocks());

// ── CreateAccountUseCase ───────────────────────────────────────────────────────

describe('CreateAccountUseCase', () => {
  it('crée un compte via le repository', async () => {
    const dto = { code: '601', name: 'Achats', account_class: 6 } as any;
    const created = makeAccount('601');
    mockRepo.create.mockResolvedValue(created);

    const uc = new CreateAccountUseCase(mockRepo as any);
    const result = await uc.execute(dto, USER_ID);

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ code: '601' }), USER_ID);
    expect(result).toBe(created);
  });
});

// ── DeleteAccountUseCase ───────────────────────────────────────────────────────

describe('DeleteAccountUseCase', () => {
  it('supprime le compte quand il existe et n\'est pas système', async () => {
    mockRepo.getAccount.mockResolvedValue(makeAccount('601', 1, false));
    mockRepo.deleteAccount.mockResolvedValue(undefined);

    const uc = new DeleteAccountUseCase(mockRepo as any);
    await uc.execute(1, USER_ID);

    expect(mockRepo.deleteAccount).toHaveBeenCalledWith(1, USER_ID);
  });

  it('lève NotFoundException si le compte est introuvable', async () => {
    mockRepo.getAccount.mockResolvedValue(null);
    await expect(new DeleteAccountUseCase(mockRepo as any).execute(99, USER_ID))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ForbiddenException pour un compte système', async () => {
    mockRepo.getAccount.mockResolvedValue(makeAccount('401', 1, true));
    await expect(new DeleteAccountUseCase(mockRepo as any).execute(1, USER_ID))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});

// ── FindAccountsUseCase ────────────────────────────────────────────────────────

describe('FindAccountsUseCase', () => {
  it('retourne la liste des comptes', async () => {
    const accounts = [makeAccount('601'), makeAccount('701')];
    mockRepo.findAccounts.mockResolvedValue(accounts);

    const result = await new FindAccountsUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(accounts);
    expect(mockRepo.findAccounts).toHaveBeenCalledWith(USER_ID);
  });
});

// ── FindByCodeUseCase ──────────────────────────────────────────────────────────

describe('FindByCodeUseCase', () => {
  it('retourne le compte par code', async () => {
    const account = makeAccount('512');
    mockRepo.findByCode.mockResolvedValue(account);

    const result = await new FindByCodeUseCase(mockRepo as any).execute('512', USER_ID);
    expect(result).toBe(account);
    expect(mockRepo.findByCode).toHaveBeenCalledWith('512', USER_ID);
  });
});

// ── GetAccountByAccountId ──────────────────────────────────────────────────────

describe('GetAccountByAccountId', () => {
  it('retourne le compte par id', async () => {
    const account = makeAccount('512', 5);
    mockRepo.getAccount.mockResolvedValue(account);

    const result = await new GetAccountByAccountId(mockRepo as any).execute(5, USER_ID);
    expect(result).toBe(account);
  });

  it('retourne null si introuvable', async () => {
    mockRepo.getAccount.mockResolvedValue(null);
    const result = await new GetAccountByAccountId(mockRepo as any).execute(99, USER_ID);
    expect(result).toBeNull();
  });
});

// ── SearchAccountUseCase ───────────────────────────────────────────────────────

describe('SearchAccountUseCase', () => {
  it('délègue la recherche au repository', async () => {
    const accounts = [makeAccount('401')];
    mockRepo.searchAccount.mockResolvedValue(accounts);

    const result = await new SearchAccountUseCase(mockRepo as any).execute('four', USER_ID);
    expect(result).toBe(accounts);
    expect(mockRepo.searchAccount).toHaveBeenCalledWith('four', USER_ID);
  });
});

// ── UpdateAccountUseCase ───────────────────────────────────────────────────────

describe('UpdateAccountUseCase', () => {
  it('met à jour le compte quand il existe et n\'est pas système', async () => {
    mockRepo.getAccount.mockResolvedValue(makeAccount('601', 1, false));
    const updated = makeAccount('601');
    mockRepo.updateAccount.mockResolvedValue(updated);

    const dto = { code: '601', name: 'Achats mat', account_class: 6 } as any;
    const result = await new UpdateAccountUseCase(mockRepo as any).execute(1, dto, USER_ID);

    expect(result).toBe(updated);
    expect(mockRepo.updateAccount).toHaveBeenCalledWith(1, dto, USER_ID);
  });

  it('lève NotFoundException si compte absent', async () => {
    mockRepo.getAccount.mockResolvedValue(null);
    await expect(new UpdateAccountUseCase(mockRepo as any).execute(99, {} as any, USER_ID))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ForbiddenException pour un compte système', async () => {
    mockRepo.getAccount.mockResolvedValue(makeAccount('401', 1, true));
    await expect(new UpdateAccountUseCase(mockRepo as any).execute(1, {} as any, USER_ID))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});
