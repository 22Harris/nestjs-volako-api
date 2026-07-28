import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FindPeriodeLocksUseCase } from '../application/use-cases/find-periode-locks.usecase';
import { LockPeriodUseCase } from '../application/use-cases/lock-period.usecase';
import { UnlockPeriodUseCase } from '../application/use-cases/unlock-period.usecase';
import { LockPeriodDto } from './dtos/lock-period.dto';
import { PeriodeLock } from '../domain/entities/periode-lock.entity';

@ApiTags('periode-locks')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('periode-locks')
export class PeriodeLocksController {
  constructor(
    private readonly findAll: FindPeriodeLocksUseCase,
    private readonly lock: LockPeriodUseCase,
    private readonly unlock: UnlockPeriodUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les périodes verrouillées' })
  getAll(@CurrentUser() userId: number): Promise<PeriodeLock[]> {
    return this.findAll.execute(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Verrouiller une période comptable (mois/année)' })
  @ApiResponse({ status: 201, description: 'Période verrouillée' })
  @ApiResponse({ status: 409, description: 'Période déjà verrouillée' })
  lockPeriod(@Body() dto: LockPeriodDto, @CurrentUser() userId: number): Promise<PeriodeLock> {
    return this.lock.execute(dto.annee, dto.mois, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Déverrouiller une période comptable' })
  @ApiResponse({ status: 204, description: 'Période déverrouillée' })
  unlockPeriod(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<void> {
    return this.unlock.execute(id, userId);
  }
}
