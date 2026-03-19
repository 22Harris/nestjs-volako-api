import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateFiscalYearUseCase } from '../application/use-cases/create-fiscal-year.usecase';
import { FindFiscalYearsUseCase } from '../application/use-cases/find-fiscal-years.usecase';
import { GetFiscalYearUseCase } from '../application/use-cases/get-fiscal-year.usecase';
import { CloseFiscalYearUseCase } from '../application/use-cases/close-fiscal-year.usecase';
import { CreateFiscalYearDto } from './dtos/create-fiscal-year.dto';
import { FiscalYear } from '../domain/entities/fiscal-year.entity';

@UseGuards(JwtAuthGuard)
@Controller('fiscal-years')
export class FiscalYearsController {
  constructor(
    private readonly createFiscalYear: CreateFiscalYearUseCase,
    private readonly findFiscalYears: FindFiscalYearsUseCase,
    private readonly getFiscalYear: GetFiscalYearUseCase,
    private readonly closeFiscalYear: CloseFiscalYearUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateFiscalYearDto, @CurrentUser() userId: number): Promise<FiscalYear> {
    return this.createFiscalYear.execute(dto.annee, userId);
  }

  @Get()
  findAll(@CurrentUser() userId: number): Promise<FiscalYear[]> {
    return this.findFiscalYears.execute(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<FiscalYear> {
    return this.getFiscalYear.execute(id, userId);
  }

  @Post(':annee/cloturer')
  @HttpCode(200)
  cloturer(
    @Param('annee', ParseIntPipe) annee: number,
    @CurrentUser() userId: number,
  ): Promise<FiscalYear> {
    return this.closeFiscalYear.execute(annee, userId);
  }
}
