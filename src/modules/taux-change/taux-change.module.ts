import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TauxChangeController } from './taux-change.controller';
import { TauxChangeService } from './taux-change.service';

@Module({
  imports: [AuthModule],
  controllers: [TauxChangeController],
  providers: [TauxChangeService],
})
export class TauxChangeModule {}
