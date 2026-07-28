export class CentreAnalytique {
  constructor(
    public readonly code: string,
    public readonly libelle: string,
    public readonly userId: number,
    public readonly id?: number,
  ) {}
}

export interface AffectationLigne {
  centreId: number;
  pourcentage: number;
}

export interface LigneAnalytique {
  id: number;
  journalLineId: number;
  centreId: number;
  pourcentage: number;
  centreCode?: string;
  centreLibelle?: string;
}

export interface BalanceCentre {
  centre: CentreAnalytique;
  debit: number;
  credit: number;
  solde: number;
}
