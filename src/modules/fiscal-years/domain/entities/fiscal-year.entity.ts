export enum FiscalYearStatus {
  OUVERT = 'OUVERT',
  CLOTURE = 'CLOTURE',
}

export class FiscalYear {
  constructor(
    public readonly annee: number,
    public readonly statut: FiscalYearStatus,
    public readonly userId: number,
    public readonly createdAt: Date,
    public readonly id?: number,
    public readonly closedAt?: Date,
  ) {}
}
