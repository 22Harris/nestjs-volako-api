import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OperationsController } from './interface/operations.controller';
import { DbOperationsRepository } from './infrastructure/repositories/db.operations.repository';
import { OPERATIONS_REPOSITORY } from './application/ports/operation.repository.token';
import { CreateOperationUseCase } from './application/use-cases/create_operation.usecase';
import { FindOperationsUseCase } from './application/use-cases/find_operations.usecase';
import { GetOperationUseCase } from './application/use-cases/get_operation.usecase';
import { UpdateOperationUseCase } from './application/use-cases/update_operation.usecase';
import { DeleteOperationUseCase } from './application/use-cases/delete_operation.usecase';
import { JournalEntryModule } from '../journal-entries/journal-entries.module';
import { AccountModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, JournalEntryModule, AccountModule, AuthModule],
  controllers: [OperationsController],
  providers: [
    CreateOperationUseCase,
    FindOperationsUseCase,
    GetOperationUseCase,
    UpdateOperationUseCase,
    DeleteOperationUseCase,
    {
      provide: OPERATIONS_REPOSITORY,
      useClass: DbOperationsRepository,
    },
  ],
  exports: [OPERATIONS_REPOSITORY],
})
export class OperationsModule {}
