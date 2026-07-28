import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RgpdController } from './interface/rgpd.controller';
import { ExporterDonneesPersonnellesUseCase } from './application/use-cases/exporter-donnees.usecase';
import { AnonymiserUtilisateurUseCase } from './application/use-cases/anonymiser-utilisateur.usecase';
import { CreerDemandeRgpdUseCase } from './application/use-cases/creer-demande-rgpd.usecase';
import { ListDemandesRgpdUseCase } from './application/use-cases/list-demandes-rgpd.usecase';
import { TraiterDemandeRgpdUseCase } from './application/use-cases/traiter-demande-rgpd.usecase';
import { PurgerAuditLogsUseCase } from './application/use-cases/purger-audit-logs.usecase';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RgpdController],
  providers: [
    ExporterDonneesPersonnellesUseCase,
    AnonymiserUtilisateurUseCase,
    CreerDemandeRgpdUseCase,
    ListDemandesRgpdUseCase,
    TraiterDemandeRgpdUseCase,
    PurgerAuditLogsUseCase,
  ],
})
export class RgpdModule {}
