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

@Module({
  imports: [PrismaModule],
  controllers: [JournalEntryController],
  providers: [
    CreateJournalEntryUseCase,
    FindJournalEntriesUseCase,
    GetJournalEntryByIdUseCase,
    UpdateLabelOfJournalEntryUseCase,
    DeleteJournalEntryUseCase,
    {
      provide: JOURNAL_ENTRIES,
      useClass: DbJournalEntryRepository,
    },
  ],
  exports: [JOURNAL_ENTRIES, CreateJournalEntryUseCase],
})
export class JournalEntryModule {}
