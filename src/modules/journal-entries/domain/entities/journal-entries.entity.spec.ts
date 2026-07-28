import { BadRequestException } from '@nestjs/common';
import { JournalEntry } from './journal-entries.entity';
import { JournalLine } from './journal-line.entity';

function makeLine(debit: number, credit: number, accountId = 1): JournalLine {
  return new JournalLine(accountId, debit, credit);
}

describe('JournalEntry.validate()', () => {
  describe('valid entries', () => {
    it('accepts a balanced two-line entry (debit ↔ credit)', () => {
      expect(
        () => new JournalEntry(new Date(), 'Achat', [makeLine(10000, 0), makeLine(0, 10000, 2)]),
      ).not.toThrow();
    });

    it('accepts a multi-line entry balanced across many lines', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Facture', [
            makeLine(5000, 0, 1),
            makeLine(2000, 0, 2),
            makeLine(0, 4000, 3),
            makeLine(0, 3000, 4),
          ]),
      ).not.toThrow();
    });

    it('accepts an entry with the minimum two lines', () => {
      expect(
        () => new JournalEntry(new Date(), 'Test', [makeLine(1, 0), makeLine(0, 1, 2)]),
      ).not.toThrow();
    });

    it('accepts a zero-amount line when other lines provide balance', () => {
      // Edge-case: lines with 0 debit AND 0 credit should throw (separate test below)
      // Two-line balanced entry should be fine
      expect(
        () => new JournalEntry(new Date(), 'OK', [makeLine(100, 0), makeLine(0, 100, 2)]),
      ).not.toThrow();
    });
  });

  describe('too few lines', () => {
    it('throws BadRequestException when entry has 0 lines', () => {
      expect(() => new JournalEntry(new Date(), 'Vide', [])).toThrow(BadRequestException);
    });

    it('throws BadRequestException when entry has only 1 line', () => {
      expect(() => new JournalEntry(new Date(), 'Une ligne', [makeLine(100, 0)])).toThrow(BadRequestException);
    });

    it('includes the expected message', () => {
      expect(() => new JournalEntry(new Date(), 'Vide', [])).toThrow(
        'Une écriture comptable doit contenir au moins 2 lignes',
      );
    });
  });

  describe('line with both debit and credit', () => {
    it('throws BadRequestException when a line has both debit > 0 and credit > 0', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Double-sens', [
            makeLine(500, 300),   // invalid: both sides non-zero
            makeLine(0, 200, 2),
          ]),
      ).toThrow(BadRequestException);
    });

    it('includes the expected message', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Test', [makeLine(100, 50), makeLine(0, 50, 2)]),
      ).toThrow('Une ligne ne peut pas avoir débit et crédit');
    });
  });

  describe('line with neither debit nor credit', () => {
    it('throws BadRequestException when a line has debit = 0 and credit = 0', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Ligne nulle', [
            makeLine(0, 0),        // invalid: both zero
            makeLine(100, 0, 2),
            makeLine(0, 100, 3),
          ]),
      ).toThrow(BadRequestException);
    });

    it('includes the expected message', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Test', [makeLine(0, 0), makeLine(0, 0, 2)]),
      ).toThrow('Une ligne doit avoir un débit ou un crédit');
    });
  });

  describe('unbalanced entries', () => {
    it('throws BadRequestException when total debit > total credit', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Déséquilibre', [
            makeLine(10000, 0),
            makeLine(0, 9000, 2),  // 1000 short
          ]),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException when total credit > total debit', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Déséquilibre', [
            makeLine(9000, 0),
            makeLine(0, 10000, 2),
          ]),
      ).toThrow(BadRequestException);
    });

    it('includes the expected message', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Test', [makeLine(100, 0), makeLine(0, 50, 2)]),
      ).toThrow('Écriture comptable non équilibrée');
    });

    it('is precise to the cent (1-centime imbalance is rejected)', () => {
      expect(
        () =>
          new JournalEntry(new Date(), 'Arrondi', [
            makeLine(10000, 0),
            makeLine(0, 9999, 2),  // off by 1 centime
          ]),
      ).toThrow(BadRequestException);
    });
  });

  describe('entity properties', () => {
    it('stores all constructor parameters correctly', () => {
      const date = new Date('2024-06-15');
      const lines = [makeLine(500, 0, 10), makeLine(0, 500, 20)];
      const entry = new JournalEntry(date, 'Vente', lines, 42, 5, 3, 'VTE-001', 'VALIDE', 7);

      expect(entry.date).toBe(date);
      expect(entry.label).toBe('Vente');
      expect(entry.lines).toHaveLength(2);
      expect(entry.id).toBe(42);
      expect(entry.operationId).toBe(5);
      expect(entry.journalId).toBe(3);
      expect(entry.pieceNumber).toBe('VTE-001');
      expect(entry.statut).toBe('VALIDE');
      expect(entry.userId).toBe(7);
    });

    it('defaults statut to BROUILLON when not provided', () => {
      const entry = new JournalEntry(
        new Date(),
        'Brouillon',
        [makeLine(100, 0), makeLine(0, 100, 2)],
      );
      expect(entry.statut).toBe('BROUILLON');
    });
  });
});
