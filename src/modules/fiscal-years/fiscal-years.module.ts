import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { JournalEntryModule } from '../journal-entries/journal-entries.module';
import { AccountModule } from '../accounts/accounts.module';
import { PeriodeLocksModule } from '../periode-locks/periode-locks.module';
import { FISCAL_YEAR_REPOSITORY } from './application/ports/fiscal-year.token';
import { DbFiscalYearRepository } from './infrastructure/repositories/db.fiscal-year.repository';
import { CreateFiscalYearUseCase } from './application/use-cases/create-fiscal-year.usecase';
import { FindFiscalYearsUseCase } from './application/use-cases/find-fiscal-years.usecase';
import { GetFiscalYearUseCase } from './application/use-cases/get-fiscal-year.usecase';
import { CloseFiscalYearUseCase } from './application/use-cases/close-fiscal-year.usecase';
import { FiscalYearsController } from './interface/fiscal-years.controller';

@Module({
  imports: [PrismaModule, AuthModule, JournalEntryModule, AccountModule, PeriodeLocksModule, AuditLogModule],
  controllers: [FiscalYearsController],
  providers: [
    CreateFiscalYearUseCase,
    FindFiscalYearsUseCase,
    GetFiscalYearUseCase,
    CloseFiscalYearUseCase,
    { provide: FISCAL_YEAR_REPOSITORY, useClass: DbFiscalYearRepository },
  ],
})
export class FiscalYearsModule {}
