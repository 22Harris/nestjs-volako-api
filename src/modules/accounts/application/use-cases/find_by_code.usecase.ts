import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNTS_REPOSITORY } from '../ports/accounts.repository.token';
import { Account } from '../../domain/entities/account.entity';
import { DbAccountRepository } from '../../infrastructure/repositories/db.accounts.repository';

@Injectable()
export class FindByCodeUseCase {
  constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountRepository: DbAccountRepository,
  ) {}

  async execute(code: string): Promise<Account> {
    return this.accountRepository.findByCode(code);
  }
}
