import { forwardRef, Module } from '@nestjs/common';
import { ACCOUNTS_REPOSITORY } from './application/ports/accounts.repository.token';
import { CreateAccountUseCase } from './application/use-cases/create_account.usecase';
import { DbAccountRepository } from './infrastructure/repositories/db.accounts.repository';
import { AccountController } from './interface/accounts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FindAccountsUseCase } from './application/use-cases/find_accounts.usecase';
import { SearchAccountUseCase } from './application/use-cases/search_account.usecase';
import { UpdateAccountUseCase } from './application/use-cases/update_account.usecase';
import { GetAccountByAccountId } from './application/use-cases/get_account_by_accountID.usecase';
import { FindByCodeUseCase } from './application/use-cases/find_by_code.usecase';
import { DeleteAccountUseCase } from './application/use-cases/delete_account.usecase';
import { InitPcgUseCase } from './application/use-cases/init_pcg.usecase';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AccountController],
  providers: [
    CreateAccountUseCase,
    FindAccountsUseCase,
    SearchAccountUseCase,
    UpdateAccountUseCase,
    GetAccountByAccountId,
    FindByCodeUseCase,
    DeleteAccountUseCase,
    InitPcgUseCase,
    {
      provide: ACCOUNTS_REPOSITORY,
      useClass: DbAccountRepository,
    },
  ],
  exports: [ACCOUNTS_REPOSITORY, InitPcgUseCase],
})
export class AccountModule {}
