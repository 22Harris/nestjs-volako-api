import { Inject, Injectable } from '@nestjs/common';
import { BUDGET_REPOSITORY } from '../ports/budget.repository.token';
import type { BudgetRepository } from '../ports/budget.repository.interface';
import { Budget, BudgetLigne } from '../../domain/entities/budget.entity';
@Injectable()
export class SaveLigneUseCase {
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: BudgetRepository) {}
  execute(budgetId: number, ligne: Partial<BudgetLigne> & { id?: number }): Promise<Budget> {
    return this.repo.saveLigne(budgetId, ligne);
  }
}
