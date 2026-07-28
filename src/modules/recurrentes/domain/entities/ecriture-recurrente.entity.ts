import type { CodeTva } from '../../../journal-entries/domain/entities/journal-line.entity';

export type Frequence = 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL';

export interface LigneRecurrenteData {
  id?: number;
  accountId: number;
  debit: number;
  credit: number;
  codeTva?: CodeTva;
}

export class EcritureRecurrente {
  constructor(
    public readonly label: string,
    public readonly frequence: Frequence,
    public readonly prochainExecution: Date,
    public readonly lignes: LigneRecurrenteData[],
    public readonly actif: boolean = true,
    public readonly journalId?: number,
    public readonly id?: number,
    public readonly userId?: number,
  ) {}

  /** Calcule la prochaine date d'exécution après `from`. */
  static nextExecution(frequence: Frequence, from: Date): Date {
    const d = new Date(from);
    switch (frequence) {
      case 'QUOTIDIEN':    d.setDate(d.getDate() + 1);        break;
      case 'HEBDOMADAIRE': d.setDate(d.getDate() + 7);        break;
      case 'MENSUEL':      d.setMonth(d.getMonth() + 1);      break;
      case 'TRIMESTRIEL':  d.setMonth(d.getMonth() + 3);      break;
      case 'ANNUEL':       d.setFullYear(d.getFullYear() + 1); break;
    }
    return d;
  }
}
