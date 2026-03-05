import { Budget, BudgetLigne } from '../../domain/entities/budget.entity';
export interface BudgetRepository {
  findAll(): Promise<Budget[]>;
  findByMois(exercice: number, mois: number): Promise<Budget | null>;
  create(exercice: number, mois: number): Promise<Budget>;
  delete(id: number): Promise<void>;
  saveLigne(budgetId: number, ligne: Partial<BudgetLigne> & { id?: number }): Promise<Budget>;
  deleteLigne(budgetId: number, ligneId: number): Promise<Budget>;
}
