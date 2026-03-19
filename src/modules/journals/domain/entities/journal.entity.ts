import { JournalType } from '@prisma/client';

export class Journal {
  constructor(
    public readonly type: JournalType,
    public readonly userId: number,
    public readonly id?: number,
  ) {}

  get prefix(): string {
    const map: Record<JournalType, string> = {
      ACHATS: 'AC',
      VENTES: 'VT',
      BANQUE: 'BQ',
      CAISSE: 'CA',
      OD: 'OD',
    };
    return map[this.type];
  }
}
