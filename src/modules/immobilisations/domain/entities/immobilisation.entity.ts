export type MethodeAmortissement = 'LINEAIRE' | 'DEGRESSIF';
export type StatutImmobilisation = 'ACTIF' | 'CEDE';

export class LigneAmortissement {
  constructor(
    public readonly exercice: number,
    public readonly dotation: number,
    public readonly cumulAmortissement: number,
    public readonly valeurNetteComptable: number,
    public readonly comptabilisee: boolean = false,
    public readonly id?: number,
    public readonly journalEntryId?: number,
  ) {}
}

export class Immobilisation {
  constructor(
    public readonly libelle: string,
    public readonly dateAcquisition: Date,
    public readonly valeurBrute: number,
    public readonly dureeAmortissement: number,
    public readonly methode: MethodeAmortissement,
    public readonly compteBilanCode: string,
    public readonly compteAmortissementCode: string,
    public readonly compteChargeCode: string,
    public readonly statut: StatutImmobilisation = 'ACTIF',
    public readonly lignes: LigneAmortissement[] = [],
    public readonly id?: number,
    public readonly userId?: number,
    public readonly dateCession?: Date,
    public readonly prixCession?: number,
  ) {}
}
