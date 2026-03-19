import { Injectable } from '@nestjs/common';
import { AccountRepository } from '../../application/ports/accounts.repository.interface';
import { Account } from '../../domain/entities/account.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDto } from '../../interface/dtos/create-account.dto';

@Injectable()
export class DbAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(account: Account, userId: number): Promise<Account> {
    const row = await this.prisma.account.create({
      data: { code: account.code, name: account.name, class: account.account_class, isSystem: account.isSystem ?? false, userId },
    });
    return new Account(row.code, row.name, row.class, row.id, row.isSystem);
  }

  async findAccounts(userId: number): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({ where: { userId } });
    return accounts.map((a) => new Account(a.code, a.name, a.class, a.id, a.isSystem));
  }

  async searchAccount(query: string, userId: number): Promise<Account[]> {
    const isNumber = !Number.isNaN(Number(query));
    const accounts = await this.prisma.account.findMany({
      where: {
        userId,
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          ...(isNumber ? [{ class: Number(query) }] : []),
        ],
      },
    });
    return accounts.map((a) => new Account(a.code, a.name, a.class, a.id, a.isSystem));
  }

  async updateAccount(accountId: number, account: CreateAccountDto, userId: number): Promise<Account> {
    const row = await this.prisma.account.update({
      where: { id: accountId, userId },
      data: {
        ...(account.code !== undefined && { code: account.code }),
        ...(account.name !== undefined && { name: account.name }),
        ...(account.account_class !== undefined && { class: account.account_class }),
      },
    });
    return new Account(row.code, row.name, row.class, row.id, row.isSystem);
  }

  async getAccount(accountId: number, userId: number): Promise<Account | null> {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) return null;
    return new Account(account.code, account.name, account.class, account.id, account.isSystem);
  }

  async findByCode(code: string, userId: number): Promise<Account> {
    const row = await this.prisma.account.findFirst({ where: { code, userId } });
    if (!row) throw new Error(`Compte ${code} introuvable`);
    return new Account(row.code, row.name, row.class, row.id, row.isSystem);
  }

  async deleteAccount(accountId: number, userId: number): Promise<void> {
    await this.prisma.account.delete({ where: { id: accountId, userId } });
  }
}
