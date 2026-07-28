import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JournalEntryModule } from '../journal-entries/journal-entries.module';
import { RecurrentesController } from './interface/recurrentes.controller';
import { RECURRENTES } from './application/ports/recurrentes.token';
import { DbRecurrentesRepository } from './infrastructure/repositories/db.recurrentes.repository';
import { CreerRecurrenteUseCase } from './application/use-cases/creer-recurrente.usecase';
import { ListerRecurrentesUseCase } from './application/use-cases/lister-recurrentes.usecase';
import { ModifierRecurrenteUseCase } from './application/use-cases/modifier-recurrente.usecase';
import { SupprimerRecurrenteUseCase } from './application/use-cases/supprimer-recurrente.usecase';
import { ExecuterRecurrentesUseCase } from './application/use-cases/executer-recurrentes.usecase';

@Module({
  imports: [PrismaModule, AuthModule, JournalEntryModule],
  controllers: [RecurrentesController],
  providers: [
    CreerRecurrenteUseCase,
    ListerRecurrentesUseCase,
    ModifierRecurrenteUseCase,
    SupprimerRecurrenteUseCase,
    ExecuterRecurrentesUseCase,
    { provide: RECURRENTES, useClass: DbRecurrentesRepository },
  ],
})
export class RecurrentesModule {}
