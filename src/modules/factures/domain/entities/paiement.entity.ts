export class Paiement {
  constructor(
    public readonly date: Date,
    public readonly montant: number,
    public readonly mode: string,
    public readonly factureId: number,
    public readonly id?: number,
    public readonly reference?: string,
  ) {}
}
