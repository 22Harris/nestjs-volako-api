import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditController } from './audit.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AuditController],
})
export class AuditModule {}
