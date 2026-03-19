import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TvaController } from './tva.controller';
import { TvaService } from './tva.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TvaController],
  providers: [TvaService],
})
export class TvaModule {}
