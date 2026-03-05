export class BudgetLigne {
  constructor(
    public readonly categorie: string,
    public readonly libelle: string,
    public readonly montantPrevu: number,
    public readonly type: string,
    public readonly budgetId: number,
    public readonly id?: number,
  ) {}
}

export class Budget {
  constructor(
    public readonly exercice: number,
    public readonly mois: number,
    public readonly lignes: BudgetLigne[],
    public readonly id?: number,
  ) {}
}
