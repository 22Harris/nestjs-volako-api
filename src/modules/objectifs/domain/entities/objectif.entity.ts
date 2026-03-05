export class Objectif {
  constructor(
    public readonly nom: string,
    public readonly categorie: string,
    public readonly montantCible: number,
    public readonly montantActuel: number,
    public readonly dateDebut: Date,
    public readonly dateEcheance: Date,
    public readonly couleur: string,
    public readonly icone: string,
    public readonly statut: string,
    public readonly id?: number,
    public readonly description?: string,
  ) {}
}
