import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TiersController } from './interface/tiers.controller';
import { TIERS_REPOSITORY } from './application/ports/tiers.repository.token';
import { DbTiersRepository } from './infrastructure/repositories/db.tiers.repository';
import { FindTiersUseCase } from './application/use-cases/find-tiers.usecase';
import { GetTiersUseCase } from './application/use-cases/get-tiers.usecase';
import { CreateTiersUseCase } from './application/use-cases/create-tiers.usecase';
import { UpdateTiersUseCase } from './application/use-cases/update-tiers.usecase';
import { DeleteTiersUseCase } from './application/use-cases/delete-tiers.usecase';
import { GetSoldesUseCase } from './application/use-cases/get-soldes.usecase';
import { SearchTiersUseCase } from './application/use-cases/search-tiers.usecase';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TiersController],
  providers: [
    FindTiersUseCase, GetTiersUseCase, CreateTiersUseCase,
    UpdateTiersUseCase, DeleteTiersUseCase, GetSoldesUseCase, SearchTiersUseCase,
    { provide: TIERS_REPOSITORY, useClass: DbTiersRepository },
  ],
  exports: [FindTiersUseCase, SearchTiersUseCase],
})
export class TiersModule {}
