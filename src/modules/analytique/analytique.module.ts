import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ANALYTIQUE_REPOSITORY } from './application/ports/analytique.repository.token';
import { DbAnalytiqueRepository } from './infrastructure/repositories/db.analytique.repository';
import { CreateCentreAnalytiqueUseCase } from './application/use-cases/create-centre.usecase';
import { ListCentresAnalytiquesUseCase } from './application/use-cases/list-centres.usecase';
import { UpdateCentreAnalytiqueUseCase } from './application/use-cases/update-centre.usecase';
import { DeleteCentreAnalytiqueUseCase } from './application/use-cases/delete-centre.usecase';
import { AffecterLignesAnalytiquesUseCase } from './application/use-cases/affecter-lignes.usecase';
import { GetBalanceAnalytiqueUseCase } from './application/use-cases/get-balance-analytique.usecase';
import { AnalytiqueController } from './interface/analytique.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AnalytiqueController],
  providers: [
    { provide: ANALYTIQUE_REPOSITORY, useClass: DbAnalytiqueRepository },
    CreateCentreAnalytiqueUseCase,
    ListCentresAnalytiquesUseCase,
    UpdateCentreAnalytiqueUseCase,
    DeleteCentreAnalytiqueUseCase,
    AffecterLignesAnalytiquesUseCase,
    GetBalanceAnalytiqueUseCase,
  ],
})
export class AnalytiqueModule {}
