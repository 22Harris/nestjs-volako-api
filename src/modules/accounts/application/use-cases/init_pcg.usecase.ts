import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNTS_REPOSITORY } from '../ports/accounts.repository.token';
import type { AccountRepository } from '../ports/accounts.repository.interface';
import { Account } from '../../domain/entities/account.entity';
import { PCG_DATA } from '../../../../../prisma/pcg-data.js';

@Injectable()
export class InitPcgUseCase {
  constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(userId: number): Promise<{ created: number; skipped: number }> {
    const existing = await this.accountRepository.findAccounts(userId);
    const existingCodes = new Set(existing.map(a => a.code));

    let created = 0;
    let skipped = 0;

    for (const entry of PCG_DATA) {
      if (existingCodes.has(entry.code)) {
        skipped++;
        continue;
      }
      await this.accountRepository.create(
        new Account(entry.code, entry.name, entry.class, undefined, true),
        userId,
      );
      created++;
    }

    return { created, skipped };
  }
}
