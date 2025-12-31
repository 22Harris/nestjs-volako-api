import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../application/ports/accounts.repository.interface";
import { Account } from "../../domain/entities/account.entity";
import { PrismaService } from "src/prisma/prisma.service";

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
    
}