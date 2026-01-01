import { JournalLine } from "./journal-line.entity";


export class JournalEntry {
  constructor(
    public readonly date: Date,
    public readonly label: string,
    public readonly lines: JournalLine[],
    public readonly id?: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.lines.length < 2) {
      throw new Error('Une écriture comptable doit contenir au moins 2 lignes');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of this.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new Error('Une ligne ne peut pas avoir débit et crédit');
      }

      if (line.debit === 0 && line.credit === 0) {
        throw new Error('Une ligne doit avoir un débit ou un crédit');
      }

      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    if (totalDebit !== totalCredit) {
      throw new Error('Écriture comptable non équilibrée');
    }
  }
}
