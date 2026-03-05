import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EvenementsController } from './interface/evenements.controller';
import { EVENEMENT_REPOSITORY } from './application/ports/evenement.repository.token';
import { DbEvenementRepository } from './infrastructure/repositories/db.evenement.repository';
import { FindEvenementsUseCase } from './application/use-cases/find-evenements.usecase';
import { GetEvenementUseCase } from './application/use-cases/get-evenement.usecase';
import { CreateEvenementUseCase } from './application/use-cases/create-evenement.usecase';
import { UpdateEvenementUseCase } from './application/use-cases/update-evenement.usecase';
import { DeleteEvenementUseCase } from './application/use-cases/delete-evenement.usecase';
import { MarquerPayeUseCase } from './application/use-cases/marquer-paye.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [EvenementsController],
  providers: [
    FindEvenementsUseCase, GetEvenementUseCase, CreateEvenementUseCase,
    UpdateEvenementUseCase, DeleteEvenementUseCase, MarquerPayeUseCase,
    { provide: EVENEMENT_REPOSITORY, useClass: DbEvenementRepository },
  ],
})
export class EvenementsModule {}
