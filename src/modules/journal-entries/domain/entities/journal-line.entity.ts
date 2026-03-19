export type CodeTva =
  | 'NORMAL_20'
  | 'INTERMEDIAIRE_10'
  | 'REDUIT_5_5'
  | 'PARTICULIER_2_1'
  | 'EXONERE'
  | 'HORS_CHAMP';

export class JournalLine {
  constructor(
    public readonly accountId: number,
    public readonly debit: number,
    public readonly credit: number,
    public readonly id?: number,
    public readonly codeTva?: CodeTva,
  ) {}
}
