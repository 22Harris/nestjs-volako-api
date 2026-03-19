export class LigneReleve {
  constructor(
    public readonly releveId: number,
    public readonly date: Date,
    public readonly libelle: string,
    public readonly montant: number,
    public readonly reference: string | null,
    public readonly rapprochee: boolean,
    public readonly journalLineId: number | null,
    public readonly id?: number,
  ) {}
}
