import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './modules/accounts/accounts.module';
import { JournalEntryModule } from './modules/journal-entries/journal-entries.module';

@Module({
  imports: [AccountModule, JournalEntryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
