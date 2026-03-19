import { Budget, BudgetLigne } from '../../domain/entities/budget.entity';
export interface BudgetRepository {
  findAll(userId: number): Promise<Budget[]>;
  findByMois(exercice: number, mois: number, userId: number): Promise<Budget | null>;
  create(exercice: number, mois: number, userId: number): Promise<Budget>;
  delete(id: number, userId: number): Promise<void>;
  saveLigne(budgetId: number, ligne: Partial<BudgetLigne> & { id?: number }, userId: number): Promise<Budget>;
  deleteLigne(budgetId: number, ligneId: number, userId: number): Promise<Budget>;
}
