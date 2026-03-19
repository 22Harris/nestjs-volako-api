import { Account } from './../../domain/entities/account.entity';
import { CreateAccountDto } from '../../interface/dtos/create-account.dto';

export interface AccountRepository {
  create(account: Account, userId: number): Promise<Account>;
  findAccounts(userId: number): Promise<Account[]>;
  searchAccount(query: string, userId: number): Promise<Account[]>;
  updateAccount(accountId: number, account: CreateAccountDto, userId: number): Promise<Account>;
  getAccount(accountId: number, userId: number): Promise<Account | null>;
  findByCode(code: string, userId: number): Promise<Account>;
  deleteAccount(accountId: number, userId: number): Promise<void>;
}
