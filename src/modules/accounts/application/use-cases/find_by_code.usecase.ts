import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNTS_REPOSITORY } from '../ports/accounts.repository.token';
import { Account } from '../../domain/entities/account.entity';
import type { AccountRepository } from '../ports/accounts.repository.interface';

@Injectable()
export class FindByCodeUseCase {
  constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(code: string, userId: number): Promise<Account> {
    return this.accountRepository.findByCode(code, userId);
  }
}
