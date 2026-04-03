import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JournalEntryController } from './interface/journal-entries.controller';
import { CreateJournalEntryUseCase } from './application/use-cases/create-journal-entry.usecase';
import { JOURNAL_ENTRIES } from './application/ports/journal-entries.token';
import { DbJournalEntryRepository } from './infrastructure/repositories/db.journal-entry.repository';
import { FindJournalEntriesUseCase } from './application/use-cases/find-journal-entries.usecase';
import { GetJournalEntryByIdUseCase } from './application/use-cases/get-journal-entry-by-id.usecase';
import { UpdateLabelOfJournalEntryUseCase } from './application/use-cases/update-label-of-journal-entry.usecase';
import { DeleteJournalEntryUseCase } from './application/use-cases/delete-journal-entry.usecase';
import { LettrerLignesUseCase } from './application/use-cases/lettrer-lignes.usecase';
import { DelettrerLignesUseCase } from './application/use-cases/delettrer-lignes.usecase';
import { ValiderJournalEntryUseCase } from './application/use-cases/valider-journal-entry.usecase';
import { RejeterJournalEntryUseCase } from './application/use-cases/rejeter-journal-entry.usecase';
import { VerrouillerJournalEntryUseCase } from './application/use-cases/verrouiller-journal-entry.usecase';
import { AuthModule } from '../auth/auth.module';
import { PeriodeLocksModule } from '../periode-locks/periode-locks.module';

@Module({
  imports: [PrismaModule, AuthModule, PeriodeLocksModule],
  controllers: [JournalEntryController],
  providers: [
    CreateJournalEntryUseCase,
    FindJournalEntriesUseCase,
    GetJournalEntryByIdUseCase,
    UpdateLabelOfJournalEntryUseCase,
    DeleteJournalEntryUseCase,
    LettrerLignesUseCase,
    DelettrerLignesUseCase,
    ValiderJournalEntryUseCase,
    RejeterJournalEntryUseCase,
    VerrouillerJournalEntryUseCase,
    {
      provide: JOURNAL_ENTRIES,
      useClass: DbJournalEntryRepository,
    },
  ],
  exports: [JOURNAL_ENTRIES, CreateJournalEntryUseCase],
})
export class JournalEntryModule {}
