import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OperationsController } from './interface/operations.controller';
import { DbOperationsRepository } from './infrastructure/repositories/db.operations.repository';
import { OPERATIONS_REPOSITORY } from './application/ports/operation.repository.token';
import { CreateOperationUseCase } from './application/use-cases/create_operation.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [OperationsController],
  providers: [
    CreateOperationUseCase,
    {
      provide: OPERATIONS_REPOSITORY,
      useClass: DbOperationsRepository,
    },
  ],
  exports: [OPERATIONS_REPOSITORY],
})
export class OperationsModule {}
