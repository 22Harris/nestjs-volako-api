import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FacturesController } from './interface/factures.controller';
import { FACTURE_REPOSITORY } from './application/ports/facture.repository.token';
import { DbFactureRepository } from './infrastructure/repositories/db.facture.repository';
import { FindFacturesUseCase } from './application/use-cases/find-factures.usecase';
import { GetFactureUseCase } from './application/use-cases/get-facture.usecase';
import { CreateFactureUseCase } from './application/use-cases/create-facture.usecase';
import { UpdateFactureUseCase } from './application/use-cases/update-facture.usecase';
import { DeleteFactureUseCase } from './application/use-cases/delete-facture.usecase';
import { AddPaiementUseCase } from './application/use-cases/add-paiement.usecase';
import { LettrerUseCase } from './application/use-cases/lettrer.usecase';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FacturesController],
  providers: [
    FindFacturesUseCase, GetFactureUseCase, CreateFactureUseCase,
    UpdateFactureUseCase, DeleteFactureUseCase, AddPaiementUseCase, LettrerUseCase,
    { provide: FACTURE_REPOSITORY, useClass: DbFactureRepository },
  ],
})
export class FacturesModule {}
