import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RapprochementController }  from './interface/rapprochement.controller';
import { ImportReleveUseCase }       from './application/use-cases/import-releve.usecase';
import { GetRelevesUseCase }         from './application/use-cases/get-releves.usecase';
import { GetReleveUseCase }          from './application/use-cases/get-releve.usecase';
import { DeleteReleveUseCase }       from './application/use-cases/delete-releve.usecase';
import { RapprocherLigneUseCase }    from './application/use-cases/rapprocher-ligne.usecase';
import { DerapprocherLigneUseCase }  from './application/use-cases/derapprocher-ligne.usecase';
import { DbRapprochementRepository } from './infrastructure/repositories/db.rapprochement.repository';
import { RAPPROCHEMENT_REPOSITORY }  from './application/ports/rapprochement.repository.token';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RapprochementController],
  providers: [
    ImportReleveUseCase,
    GetRelevesUseCase,
    GetReleveUseCase,
    DeleteReleveUseCase,
    RapprocherLigneUseCase,
    DerapprocherLigneUseCase,
    { provide: RAPPROCHEMENT_REPOSITORY, useClass: DbRapprochementRepository },
  ],
})
export class RapprochementModule {}
