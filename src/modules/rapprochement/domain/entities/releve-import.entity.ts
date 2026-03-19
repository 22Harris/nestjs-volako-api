export class ReleveImport {
  constructor(
    public readonly nom: string,
    public readonly dateDebut: Date | null,
    public readonly dateFin: Date | null,
    public readonly soldeDebut: number | null,
    public readonly soldeFin: number | null,
    public readonly id?: number,
    public readonly createdAt?: Date,
  ) {}
}
