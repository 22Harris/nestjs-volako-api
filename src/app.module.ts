import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './modules/accounts/accounts.module';
import { JournalEntryModule } from './modules/journal-entries/journal-entries.module';
import { OperationsModule } from './modules/operations/operations.module';

@Module({
  imports: [AccountModule, JournalEntryModule, OperationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
