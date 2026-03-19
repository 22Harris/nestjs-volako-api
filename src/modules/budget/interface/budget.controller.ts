import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { FindBudgetsUseCase } from '../application/use-cases/find-budgets.usecase';
import { GetBudgetByMoisUseCase } from '../application/use-cases/get-budget-by-mois.usecase';
import { CreateBudgetUseCase } from '../application/use-cases/create-budget.usecase';
import { DeleteBudgetUseCase } from '../application/use-cases/delete-budget.usecase';
import { SaveLigneUseCase } from '../application/use-cases/save-ligne.usecase';
import { DeleteLigneUseCase } from '../application/use-cases/delete-ligne.usecase';
import { CreateBudgetDto } from './dtos/create-budget.dto';
import { SaveLigneDto } from './dtos/save-ligne.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('budget')
export class BudgetController {
  constructor(
    private readonly findBudgetsUseCase: FindBudgetsUseCase,
    private readonly getBudgetByMoisUseCase: GetBudgetByMoisUseCase,
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly deleteBudgetUseCase: DeleteBudgetUseCase,
    private readonly saveLigneUseCase: SaveLigneUseCase,
    private readonly deleteLigneUseCase: DeleteLigneUseCase,
  ) {}

  @Get() findAll(@CurrentUser() userId: number, @Query('exercice') exercice?: string, @Query('mois') mois?: string) {
    if (exercice && mois) return this.getBudgetByMoisUseCase.execute(+exercice, +mois, userId);
    return this.findBudgetsUseCase.execute(userId);
  }

  @Post() create(@Body() dto: CreateBudgetDto, @CurrentUser() userId: number) {
    return this.createBudgetUseCase.execute(dto.exercice, dto.mois, userId);
  }

  @Delete(':id') @HttpCode(204) delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.deleteBudgetUseCase.execute(id, userId);
  }

  @Post(':id/ligne') saveLigne(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveLigneDto, @CurrentUser() userId: number) {
    return this.saveLigneUseCase.execute(id, dto as any, userId);
  }

  @Delete(':id/ligne/:ligneId') @HttpCode(200)
  deleteLigne(@Param('id', ParseIntPipe) id: number, @Param('ligneId', ParseIntPipe) ligneId: number, @CurrentUser() userId: number) {
    return this.deleteLigneUseCase.execute(id, ligneId, userId);
  }
}
