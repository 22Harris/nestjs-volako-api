import { Module } from "@nestjs/common";
import { ACCOUNTS_REPOSITORY } from "./application/ports/accounts.repository.token";
import { CreateAccountUseCase } from "./application/use-cases/create_account.usecase";
import { DbAccountRepository } from "./infrastructure/repositories/db.accounts.repository";
import { AccountController } from "./interface/accounts.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { FindAccountsUseCase } from "./application/use-cases/find_accounts.usecase";
import { SearchAccountUseCase } from "./application/use-cases/search_account.usecase";
import { UpdateAccountUseCase } from "./application/use-cases/update_account.usecase";
import { GetAccountByAccountId } from "./application/use-cases/get_account_by_accountID.usecase";

@Module({
    imports: [PrismaModule],
    controllers: [AccountController],
    providers: [
        CreateAccountUseCase,
        FindAccountsUseCase,
        SearchAccountUseCase,
        UpdateAccountUseCase,
        GetAccountByAccountId,
        {
            provide: ACCOUNTS_REPOSITORY,
            useClass: DbAccountRepository
        }
    ],
    exports: [ACCOUNTS_REPOSITORY],
})
export class AccountModule{}