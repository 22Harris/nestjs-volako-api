import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './modules/accounts/accounts.module';
import { JournalEntryModule } from './modules/journal-entries/journal-entries.module';
import { OperationsModule } from './modules/operations/operations.module';
import { AuthModule } from './modules/auth/auth.module';
import { EvenementsModule } from './modules/evenements/evenements.module';
import { ObjectifsModule } from './modules/objectifs/objectifs.module';
import { BudgetModule } from './modules/budget/budget.module';
import { TiersModule } from './modules/tiers/tiers.module';
import { FacturesModule } from './modules/factures/factures.module';
import { JournalsModule } from './modules/journals/journals.module';
import { PeriodeLocksModule } from './modules/periode-locks/periode-locks.module';
import { FiscalYearsModule } from './modules/fiscal-years/fiscal-years.module';
import { RapportsModule } from './modules/rapports/rapports.module';
import { TvaModule } from './modules/tva/tva.module';
import { RapprochementModule } from './modules/rapprochement/rapprochement.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { TauxChangeModule } from './modules/taux-change/taux-change.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    UsersModule,
    AuditModule,
    AccountModule,
    JournalEntryModule,
    OperationsModule,
    AuthModule,
    EvenementsModule,
    ObjectifsModule,
    BudgetModule,
    TiersModule,
    FacturesModule,
    JournalsModule,
    PeriodeLocksModule,
    FiscalYearsModule,
    RapportsModule,
    TvaModule,
    RapprochementModule,
    TauxChangeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
