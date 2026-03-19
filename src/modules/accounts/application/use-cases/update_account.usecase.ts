import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNTS_REPOSITORY } from '../ports/accounts.repository.token';
import type { AccountRepository } from '../ports/accounts.repository.interface';
import { Account } from '../../domain/entities/account.entity';
import { CreateAccountDto } from '../../interface/dtos/create-account.dto';

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(accountId: number, account: CreateAccountDto, userId: number): Promise<Account> {
    const existing = await this.accountRepository.getAccount(accountId, userId);
    if (!existing) throw new NotFoundException(`Compte ${accountId} introuvable`);
    if (existing.isSystem) {
      throw new ForbiddenException('Les comptes du plan comptable système ne peuvent pas être modifiés');
    }
    return this.accountRepository.updateAccount(accountId, account, userId);
  }
}
