import { Paiement } from './paiement.entity';

export class Facture {
  constructor(
    public readonly numero: string,
    public readonly date: Date,
    public readonly montant: number,
    public readonly statut: string,
    public readonly tiersId: number,
    public readonly id?: number,
    public readonly dateEcheance?: Date,
    public readonly notes?: string,
    public readonly tiersNom?: string,
    public readonly tiersType?: string,
    public readonly paiements?: Paiement[],
    public readonly montantPaye?: number,
    public readonly resteAPayer?: number,
  ) {}
}
