import { Inject, Injectable } from '@nestjs/common';
import { BUDGET_REPOSITORY } from '../ports/budget.repository.token';
import type { BudgetRepository } from '../ports/budget.repository.interface';
@Injectable()
export class DeleteBudgetUseCase {
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: BudgetRepository) {}
  execute(id: number): Promise<void> { return this.repo.delete(id); }
}
