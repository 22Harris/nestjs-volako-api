import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { FiscalYearRepository } from '../ports/fiscal-year.repository.interface';
import { FISCAL_YEAR_REPOSITORY } from '../ports/fiscal-year.token';
import { FiscalYear, FiscalYearStatus } from '../../domain/entities/fiscal-year.entity';
import type { JournalEntryRepository, AccountBalance } from '../../../journal-entries/application/ports/journal-entries.repository.interface';
import { JOURNAL_ENTRIES } from '../../../journal-entries/application/ports/journal-entries.token';
import type { AccountRepository } from '../../../accounts/application/ports/accounts.repository.interface';
import { ACCOUNTS_REPOSITORY } from '../../../accounts/application/ports/accounts.repository.token';
import type { PeriodeLocksRepository } from '../../../periode-locks/application/ports/periode-locks.repository.interface';
import { PERIODE_LOCKS } from '../../../periode-locks/application/ports/periode-locks.token';
import { JournalEntry } from '../../../journal-entries/domain/entities/journal-entries.entity';
import { JournalLine } from '../../../journal-entries/domain/entities/journal-line.entity';
import { Account } from '../../../accounts/domain/entities/account.entity';

@Injectable()
export class CloseFiscalYearUseCase {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepo: FiscalYearRepository,
    @Inject(JOURNAL_ENTRIES)
    private readonly journalEntryRepo: JournalEntryRepository,
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountRepo: AccountRepository,
    @Inject(PERIODE_LOCKS)
    private readonly periodeLocksRepo: PeriodeLocksRepository,
  ) {}

  async execute(annee: number, userId: number): Promise<FiscalYear> {
    // 1. Vérifier que l'exercice existe et est ouvert
    const fy = await this.fiscalYearRepo.findByAnnee(annee, userId);
    if (!fy) throw new NotFoundException(`Exercice ${annee} introuvable`);
    if (fy.statut === FiscalYearStatus.CLOTURE) {
      throw new ConflictException(`L'exercice ${annee} est déjà clôturé`);
    }

    const yearStart = new Date(`${annee}-01-01`);
    const yearEnd = new Date(`${annee}-12-31T23:59:59.999Z`);
    const closingDate = new Date(`${annee}-12-31`);

    // 2. Calculer les soldes de l'exercice
    const yearBalances = await this.journalEntryRepo.getAccountBalances(userId, yearStart, yearEnd);

    // Tous les comptes 6xx et 7xx avec un solde non nul (dans les deux sens)
    const charges = yearBalances.filter(
      (b) => b.accountCode.startsWith('6') && b.totalDebit !== b.totalCredit,
    );
    const produits = yearBalances.filter(
      (b) => b.accountCode.startsWith('7') && b.totalDebit !== b.totalCredit,
    );

    // 3. Trouver ou créer le compte 120 (Résultat de l'exercice)
    const compte120 = await this.findOrCreateAccount('120', "Résultat de l'exercice", 1, userId);

    // 4. Écriture de clôture des charges (6xx → 120)
    if (charges.length > 0) {
      const entry = this.buildClosingEntry(closingDate, `Clôture des charges — Exercice ${annee}`, charges, compte120.id!, 'charges');
      await this.journalEntryRepo.createJournalEntry(entry, undefined, userId);
    }

    // 5. Écriture de clôture des produits (7xx → 120)
    if (produits.length > 0) {
      const entry = this.buildClosingEntry(closingDate, `Clôture des produits — Exercice ${annee}`, produits, compte120.id!, 'produits');
      await this.journalEntryRepo.createJournalEntry(entry, undefined, userId);
    }

    // 6. Report à nouveau (bilan d'ouverture au 1er janvier N+1)
    const cumulativeBalances = await this.journalEntryRepo.getAccountBalances(userId, undefined, yearEnd);
    await this.createOpeningEntry(annee, cumulativeBalances, userId);

    // 7. Verrouiller toutes les périodes de l'exercice
    await this.lockAllPeriods(annee, userId);

    // 8. Clôturer l'exercice
    return this.fiscalYearRepo.close(annee, userId);
  }

  /** Construit l'écriture de clôture pour les charges (sens débit→crédit) ou produits (sens crédit→débit). */
  private buildClosingEntry(
    date: Date,
    label: string,
    balances: AccountBalance[],
    compte120Id: number,
    type: 'charges' | 'produits',
  ): JournalEntry {
    const lines: JournalLine[] = [];
    let netTotal = 0;
    for (const b of balances) {
      const net = type === 'charges' ? b.totalDebit - b.totalCredit : b.totalCredit - b.totalDebit;
      netTotal += net;
      lines.push(net > 0 ? new JournalLine(b.accountId, 0, net) : new JournalLine(b.accountId, -net, 0));
    }
    // Contrepartie 120 : côté opposé au type
    let cpt120Line: JournalLine;
    if (type === 'charges') {
      cpt120Line = netTotal > 0 ? new JournalLine(compte120Id, netTotal, 0) : new JournalLine(compte120Id, 0, -netTotal);
    } else {
      cpt120Line = netTotal > 0 ? new JournalLine(compte120Id, 0, netTotal) : new JournalLine(compte120Id, -netTotal, 0);
    }
    return new JournalEntry(date, label, [cpt120Line, ...lines]);
  }

  private async lockAllPeriods(annee: number, userId: number): Promise<void> {
    for (let mois = 1; mois <= 12; mois++) {
      const alreadyLocked = await this.periodeLocksRepo.isLocked(annee, mois, userId);
      if (!alreadyLocked) {
        await this.periodeLocksRepo.lock(annee, mois, userId);
      }
    }
  }

  private async createOpeningEntry(
    annee: number,
    balances: AccountBalance[],
    userId: number,
  ): Promise<void> {
    // Comptes de bilan : classes 1 à 5
    const bsBalances = balances.filter((b) => {
      const c = b.accountCode.charAt(0);
      return c >= '1' && c <= '5' && b.totalDebit !== b.totalCredit;
    });

    if (bsBalances.length === 0) return;

    const debitLines: JournalLine[] = [];
    const creditLines: JournalLine[] = [];

    for (const bal of bsBalances) {
      const net = bal.totalDebit - bal.totalCredit;
      if (net > 0) {
        debitLines.push(new JournalLine(bal.accountId, net, 0));
      } else {
        creditLines.push(new JournalLine(bal.accountId, 0, -net));
      }
    }

    // Compte 890 pour équilibrer si nécessaire (ne devrait pas arriver en comptabilité équilibrée)
    const totalDebit = debitLines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = creditLines.reduce((s, l) => s + l.credit, 0);
    if (totalDebit !== totalCredit) {
      const compte890 = await this.findOrCreateAccount("890", "Bilan d'ouverture", 8, userId);
      const diff = totalDebit - totalCredit;
      if (diff > 0) {
        creditLines.push(new JournalLine(compte890.id!, 0, diff));
      } else {
        debitLines.push(new JournalLine(compte890.id!, -diff, 0));
      }
    }

    const openingEntry = new JournalEntry(
      new Date(`${annee + 1}-01-01`),
      `Report à nouveau — Exercice ${annee + 1}`,
      [...debitLines, ...creditLines],
    );
    await this.journalEntryRepo.createJournalEntry(openingEntry, undefined, userId);
  }

  private async findOrCreateAccount(
    code: string,
    name: string,
    accountClass: number,
    userId: number,
  ): Promise<Account> {
    try {
      return await this.accountRepo.findByCode(code, userId);
    } catch {
      return this.accountRepo.create(new Account(code, name, accountClass), userId);
    }
  }
}
