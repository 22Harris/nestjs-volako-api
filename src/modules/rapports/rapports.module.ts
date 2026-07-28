import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { RapportsController } from './rapports.controller';
import { RapportsService } from './rapports.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule],
  controllers: [RapportsController],
  providers: [RapportsService],
  exports: [RapportsService],
})
export class RapportsModule {}
