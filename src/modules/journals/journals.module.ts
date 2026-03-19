import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JournalsController } from './interface/journals.controller';
import { FindJournalsUseCase } from './application/use-cases/find-journals.usecase';
import { GetOrCreateJournalUseCase } from './application/use-cases/get-or-create-journal.usecase';
import { JOURNALS } from './application/ports/journals.token';
import { DbJournalsRepository } from './infrastructure/repositories/db.journals.repository';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [JournalsController],
  providers: [
    FindJournalsUseCase,
    GetOrCreateJournalUseCase,
    { provide: JOURNALS, useClass: DbJournalsRepository },
  ],
  exports: [JOURNALS, GetOrCreateJournalUseCase],
})
export class JournalsModule {}
