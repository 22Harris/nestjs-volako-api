import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNTS_REPOSITORY } from '../ports/accounts.repository.token';
import type { AccountRepository } from '../ports/accounts.repository.interface';

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const account = await this.accountRepository.getAccount(id, userId);
    if (!account) throw new NotFoundException(`Compte ${id} introuvable`);
    if (account.isSystem) {
      throw new ForbiddenException('Les comptes du plan comptable système ne peuvent pas être supprimés');
    }
    return this.accountRepository.deleteAccount(id, userId);
  }
}
