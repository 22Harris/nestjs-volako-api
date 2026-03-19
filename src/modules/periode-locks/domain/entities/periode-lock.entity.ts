export class PeriodeLock {
  constructor(
    public readonly annee: number,
    public readonly mois: number,
    public readonly userId: number,
    public readonly lockedAt: Date,
    public readonly id?: number,
  ) {}
}
