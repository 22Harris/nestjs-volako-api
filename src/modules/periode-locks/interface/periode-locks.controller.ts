import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FindPeriodeLocksUseCase } from '../application/use-cases/find-periode-locks.usecase';
import { LockPeriodUseCase } from '../application/use-cases/lock-period.usecase';
import { UnlockPeriodUseCase } from '../application/use-cases/unlock-period.usecase';
import { LockPeriodDto } from './dtos/lock-period.dto';
import { PeriodeLock } from '../domain/entities/periode-lock.entity';

@UseGuards(JwtAuthGuard)
@Controller('periode-locks')
export class PeriodeLocksController {
  constructor(
    private readonly findAll: FindPeriodeLocksUseCase,
    private readonly lock: LockPeriodUseCase,
    private readonly unlock: UnlockPeriodUseCase,
  ) {}

  @Get()
  getAll(@CurrentUser() userId: number): Promise<PeriodeLock[]> {
    return this.findAll.execute(userId);
  }

  @Post()
  lockPeriod(@Body() dto: LockPeriodDto, @CurrentUser() userId: number): Promise<PeriodeLock> {
    return this.lock.execute(dto.annee, dto.mois, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  unlockPeriod(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<void> {
    return this.unlock.execute(id, userId);
  }
}
