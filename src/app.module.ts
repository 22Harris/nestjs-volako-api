import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './modules/accounts/accounts.module';
import { JournalEntryModule } from './modules/journal-entries/journal-entries.module';
import { OperationsModule } from './modules/operations/operations.module';
import { AuthModule } from './modules/auth/auth.module';
import { EvenementsModule } from './modules/evenements/evenements.module';
import { ObjectifsModule } from './modules/objectifs/objectifs.module';
import { BudgetModule } from './modules/budget/budget.module';

@Module({
  imports: [
    AccountModule,
    JournalEntryModule,
    OperationsModule,
    AuthModule,
    EvenementsModule,
    ObjectifsModule,
    BudgetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
