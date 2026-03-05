import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { FindBudgetsUseCase } from '../application/use-cases/find-budgets.usecase';
import { GetBudgetByMoisUseCase } from '../application/use-cases/get-budget-by-mois.usecase';
import { CreateBudgetUseCase } from '../application/use-cases/create-budget.usecase';
import { DeleteBudgetUseCase } from '../application/use-cases/delete-budget.usecase';
import { SaveLigneUseCase } from '../application/use-cases/save-ligne.usecase';
import { DeleteLigneUseCase } from '../application/use-cases/delete-ligne.usecase';
import { CreateBudgetDto } from './dtos/create-budget.dto';
import { SaveLigneDto } from './dtos/save-ligne.dto';

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

  @Get() findAll(@Query('exercice') exercice?: string, @Query('mois') mois?: string) {
    if (exercice && mois) return this.getBudgetByMoisUseCase.execute(+exercice, +mois);
    return this.findBudgetsUseCase.execute();
  }

  @Post() create(@Body() dto: CreateBudgetDto) {
    return this.createBudgetUseCase.execute(dto.exercice, dto.mois);
  }

  @Delete(':id') @HttpCode(204) delete(@Param('id', ParseIntPipe) id: number) {
    return this.deleteBudgetUseCase.execute(id);
  }

  @Post(':id/ligne') saveLigne(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveLigneDto) {
    return this.saveLigneUseCase.execute(id, dto as any);
  }

  @Delete(':id/ligne/:ligneId') @HttpCode(200)
  deleteLigne(@Param('id', ParseIntPipe) id: number, @Param('ligneId', ParseIntPipe) ligneId: number) {
    return this.deleteLigneUseCase.execute(id, ligneId);
  }
}
