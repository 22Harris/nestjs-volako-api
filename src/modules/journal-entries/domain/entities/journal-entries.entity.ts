import { BadRequestException } from '@nestjs/common';
import { JournalLine } from "./journal-line.entity";

export type EntryStatus = 'BROUILLON' | 'VALIDE' | 'VERROUILLE';

export class JournalEntry {
  constructor(
    public readonly date: Date,
    public readonly label: string,
    public readonly lines: JournalLine[],
    public readonly id?: number,
    public readonly operationId?: number,
    public readonly journalId?: number,
    public readonly pieceNumber?: string,
    public readonly statut: EntryStatus = 'BROUILLON',
    public readonly userId?: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.lines.length < 2) {
      throw new BadRequestException('Une écriture comptable doit contenir au moins 2 lignes');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of this.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException('Une ligne ne peut pas avoir débit et crédit');
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new BadRequestException('Une ligne doit avoir un débit ou un crédit');
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    if (totalDebit !== totalCredit) {
      throw new BadRequestException('Écriture comptable non équilibrée');
    }
  }
}
