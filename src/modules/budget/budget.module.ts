import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BudgetController } from './interface/budget.controller';
import { BUDGET_REPOSITORY } from './application/ports/budget.repository.token';
import { DbBudgetRepository } from './infrastructure/repositories/db.budget.repository';
import { FindBudgetsUseCase } from './application/use-cases/find-budgets.usecase';
import { GetBudgetByMoisUseCase } from './application/use-cases/get-budget-by-mois.usecase';
import { CreateBudgetUseCase } from './application/use-cases/create-budget.usecase';
import { DeleteBudgetUseCase } from './application/use-cases/delete-budget.usecase';
import { SaveLigneUseCase } from './application/use-cases/save-ligne.usecase';
import { DeleteLigneUseCase } from './application/use-cases/delete-ligne.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetController],
  providers: [
    FindBudgetsUseCase, GetBudgetByMoisUseCase, CreateBudgetUseCase,
    DeleteBudgetUseCase, SaveLigneUseCase, DeleteLigneUseCase,
    { provide: BUDGET_REPOSITORY, useClass: DbBudgetRepository },
  ],
})
export class BudgetModule {}
