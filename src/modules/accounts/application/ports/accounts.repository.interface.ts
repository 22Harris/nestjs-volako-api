import { Account } from './../../domain/entities/account.entity';
import { CreateAccountDto } from '../../interface/dtos/create-account.dto';

export interface AccountRepository {
  create(account: Account): Promise<Account>;
  findAccounts(): Promise<Account[]>;
  searchAccount(query: string): Promise<Account[]>;
  updateAccount(accountId: number, account: CreateAccountDto): Promise<Account>;
  getAccount(accountId: number): Promise<Account | null>;
  findByCode(code: string): Promise<Account>;
  deleteAccount(accountId: number): Promise<void>;
}
