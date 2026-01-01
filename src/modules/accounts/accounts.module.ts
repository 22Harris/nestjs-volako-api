import { Module } from "@nestjs/common";
import { ACCOUNTS_REPOSITORY } from "./application/ports/accounts.repository.token";
import { CreateAccountUseCase } from "./application/use-cases/create_account.usecase";
import { DbAccountRepository } from "./infrastructure/repositories/db.accounts.repository";
import { AccountController } from "./interface/accounts.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { FindAccountsUseCase } from "./application/use-cases/find_accounts.usecase";
import { SearchAccountUseCase } from "./application/use-cases/search_account.usecase";

@Module({
    imports: [PrismaModule],
    controllers: [AccountController],
    providers: [
        CreateAccountUseCase,
        FindAccountsUseCase,
        SearchAccountUseCase,
        {
            provide: ACCOUNTS_REPOSITORY,
            useClass: DbAccountRepository
        }
    ],
    exports: [ACCOUNTS_REPOSITORY],
})
export class AccountModule{}