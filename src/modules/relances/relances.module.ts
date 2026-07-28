import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RELANCE_REPOSITORY } from './application/ports/relance.repository.token';
import { DbRelanceRepository } from './infrastructure/repositories/db.relance.repository';
import { GetFacturesEnRetardUseCase } from './application/use-cases/get-factures-en-retard.usecase';
import { CreateRelanceUseCase } from './application/use-cases/create-relance.usecase';
import { GetRelancesUseCase } from './application/use-cases/get-relances.usecase';
import { GenerateLettreRelanceUseCase } from './application/use-cases/generate-lettre-relance.usecase';
import { RelancesController } from './interface/relances.controller';
import { RelancesSchedulerService } from './relances-scheduler.service';

@Module({
  imports: [PrismaModule, AuthModule, ScheduleModule.forRoot()],
  controllers: [RelancesController],
  providers: [
    { provide: RELANCE_REPOSITORY, useClass: DbRelanceRepository },
    GetFacturesEnRetardUseCase,
    CreateRelanceUseCase,
    GetRelancesUseCase,
    GenerateLettreRelanceUseCase,
    RelancesSchedulerService,
  ],
})
export class RelancesModule {}
