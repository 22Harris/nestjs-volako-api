import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RapportsController } from './rapports.controller';
import { RapportsService } from './rapports.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RapportsController],
  providers: [RapportsService],
})
export class RapportsModule {}
