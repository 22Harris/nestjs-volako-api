import { Inject, Injectable } from '@nestjs/common';
import { BUDGET_REPOSITORY } from '../ports/budget.repository.token';
import type { BudgetRepository } from '../ports/budget.repository.interface';
import { Budget } from '../../domain/entities/budget.entity';
@Injectable()
export class FindBudgetsUseCase {
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: BudgetRepository) {}
  execute(userId: number): Promise<Budget[]> { return this.repo.findAll(userId); }
}
