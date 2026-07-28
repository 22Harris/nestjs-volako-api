export class Relance {
  constructor(
    public readonly factureId: number,
    public readonly niveau: number,
    public readonly date: Date,
    public readonly id?: number,
    public readonly note?: string,
    public readonly factureNumero?: string,
    public readonly factureMontant?: number,
    public readonly factureResteAPayer?: number,
    public readonly dateEcheance?: Date,
    public readonly tiersNom?: string,
    public readonly tiersEmail?: string,
  ) {}

  get joursRetard(): number {
    if (!this.dateEcheance) return 0;
    return Math.max(0, Math.floor((Date.now() - this.dateEcheance.getTime()) / 86_400_000));
  }
}

export interface FactureEnRetard {
  id: number;
  numero: string;
  montant: number;
  resteAPayer: number;
  dateEcheance: Date;
  joursRetard: number;
  tiersId: number;
  tiersNom: string;
  tiersEmail: string | null;
  niveauRelanceSuivant: number;
}
