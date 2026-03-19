import { Inject, Injectable } from '@nestjs/common';
import { BUDGET_REPOSITORY } from '../ports/budget.repository.token';
import type { BudgetRepository } from '../ports/budget.repository.interface';
import { Budget } from '../../domain/entities/budget.entity';
@Injectable()
export class GetBudgetByMoisUseCase {
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: BudgetRepository) {}
  execute(exercice: number, mois: number, userId: number): Promise<Budget | null> { return this.repo.findByMois(exercice, mois, userId); }
}
