import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PeriodeLocksController } from './interface/periode-locks.controller';
import { FindPeriodeLocksUseCase } from './application/use-cases/find-periode-locks.usecase';
import { LockPeriodUseCase } from './application/use-cases/lock-period.usecase';
import { UnlockPeriodUseCase } from './application/use-cases/unlock-period.usecase';
import { PERIODE_LOCKS } from './application/ports/periode-locks.token';
import { DbPeriodeLocksRepository } from './infrastructure/repositories/db.periode-locks.repository';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PeriodeLocksController],
  providers: [
    FindPeriodeLocksUseCase,
    LockPeriodUseCase,
    UnlockPeriodUseCase,
    { provide: PERIODE_LOCKS, useClass: DbPeriodeLocksRepository },
  ],
  exports: [PERIODE_LOCKS],
})
export class PeriodeLocksModule {}
