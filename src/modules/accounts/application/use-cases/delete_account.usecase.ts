import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNTS_REPOSITORY } from '../ports/accounts.repository.token';
import type { AccountRepository } from '../ports/accounts.repository.interface';

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  execute(id: number): Promise<void> {
    return this.accountRepository.deleteAccount(id);
  }
}
