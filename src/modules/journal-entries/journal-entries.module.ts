import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { JournalEntryController } from "./interface/journal-entries.controller";
import { CreateJournalEntryUseCase } from "./application/use-cases/create-journal-entry.usecase";
import { JOURNAL_ENTRIES } from "./application/ports/journal-entries.token";
import { DbJournalEntryRepository } from "./infrastructure/repositories/db.journal-entry.repository";

@Module({
    imports: [PrismaModule],
    controllers: [JournalEntryController],
    providers: [
        CreateJournalEntryUseCase,
        {
            provide: JOURNAL_ENTRIES,
            useClass: DbJournalEntryRepository
        }
    ],
    exports : [JOURNAL_ENTRIES]
})
export class JournalEntryModule{}