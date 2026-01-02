import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../application/ports/accounts.repository.interface";
import { Account } from "../../domain/entities/account.entity";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAccountDto } from "../../interface/dtos/create-account.dto";

@Injectable()
export class DbAccountRepository implements AccountRepository{

    constructor(private readonly prisma: PrismaService) {}
   
    async create(account: Account): Promise<Account> {
      const row = await this.prisma.account.create({
        data: {
          code: account.code,
          name: account.name,
          class: account.account_class,
        },
      });

      return new Account(
        row.code,
        row.name,
        row.class,
        row.id,
      );
    }

    async findAccounts(): Promise<Account[]>{
      const accounts = await this.prisma.account.findMany()
      return accounts.map((account) => new Account(account.code, account.name,account.class, account.id))
    }

    async searchAccount(query: string): Promise<Account[]> {
      const isNumber = !isNaN(Number(query));

      const accounts = await this.prisma.account.findMany({
        where: {
          OR: [
            {
              code: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            ...(isNumber ? [
              {
                class:Number(query)
              }
            ] : [])
          ]
        }
      });
      return accounts.map((account) => new Account(account.code, account.name, account.class, account.id));
    }
    
    async updateAccount(accountId: number, account: CreateAccountDto): Promise<Account> {
      const accountFound = await this.prisma.account.update({
        where: {
          id: accountId
        },
        data: {
           ...(account.code !== undefined && { code: account.code }),
            ...(account.name !== undefined && { name: account.name }),
            ...(account.account_class !== undefined && {
                class: account.account_class,
              }),
        }
      });

      return new Account(accountFound.code, accountFound.name, accountFound.class, accountFound.id);
    }

    async getAccount(accountId: number): Promise<Account | null> {
      const account = await this.prisma.account.findUnique({
        where: {
          id: accountId,
        },
      });

       if (!account) {
          return null;
        }

        return new Account(
          account.code,
          account.name,
          account.class,
          account.id,
        );

    }
}