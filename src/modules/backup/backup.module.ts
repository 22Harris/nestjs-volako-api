import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
