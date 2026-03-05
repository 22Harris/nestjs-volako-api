export class Evenement {
  constructor(
    public readonly titre: string,
    public readonly categorie: string,
    public readonly montant: number,
    public readonly dateEcheance: Date,
    public readonly recurrence: string,
    public readonly statut: string,
    public readonly id?: number,
    public readonly notes?: string,
  ) {}
}
