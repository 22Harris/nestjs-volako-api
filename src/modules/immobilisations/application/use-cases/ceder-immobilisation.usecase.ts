import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IMMOBILISATIONS_REPOSITORY } from '../ports/immobilisations.repository.token';
import type { ImmobilisationsRepository } from '../ports/immobilisations.repository.interface';
import { JOURNAL_ENTRIES } from 'src/modules/journal-entries/application/ports/journal-entries.token';
import type { JournalEntryRepository } from 'src/modules/journal-entries/application/ports/journal-entries.repository.interface';
import { JournalEntry } from 'src/modules/journal-entries/domain/entities/journal-entries.entity';
import { JournalLine } from 'src/modules/journal-entries/domain/entities/journal-line.entity';

@Injectable()
export class CederImmobilisationUseCase {
  constructor(
    @Inject(IMMOBILISATIONS_REPOSITORY)
    private readonly immoRepo: ImmobilisationsRepository,
    @Inject(JOURNAL_ENTRIES)
    private readonly jeRepo: JournalEntryRepository,
  ) {}

  async execute(
    id: number,
    dateCession: Date,
    prixCession: number,
    userId: number,
  ): Promise<{ journalEntryId: number; plusMoinsValue: number }> {
    const immo = await this.immoRepo.findById(id, userId);
    if (!immo) throw new NotFoundException('Immobilisation introuvable');
    if (immo.statut === 'CEDE') throw new BadRequestException('L\'immobilisation est déjà cédée');

    // VNC à la date de cession = valeurBrute - cumul des dotations comptabilisées
    const cumulComptabilise = immo.lignes
      .filter(l => l.comptabilisee)
      .reduce((s, l) => s + l.dotation, 0);
    const vnc = immo.valeurBrute - cumulComptabilise;
    const plusMoinsValue = prixCession - vnc;

    // Écriture de sortie d'actif :
    // 462 (compte de cession) / Débit = prix de cession
    // 28xx (amortissements cumulés) / Débit = cumul amorti
    // 675 (valeur nette comptable cédée) / Débit = VNC si perte
    // 21xx (compte bilan) / Crédit = valeur brute
    // 775 (produit de cession) / Crédit = prix de cession si gain
    const balances = await this.jeRepo.getAccountBalances(userId);
    const findAccount = (code: string) => balances.find(a => a.accountCode === code);

    const compteBilan = findAccount(immo.compteBilanCode);
    const compteAmort = findAccount(immo.compteAmortissementCode);

    if (!compteBilan) throw new NotFoundException(`Compte bilan ${immo.compteBilanCode} introuvable`);
    if (!compteAmort) throw new NotFoundException(`Compte amortissement ${immo.compteAmortissementCode} introuvable`);

    const lines: JournalLine[] = [
      // Sortie de l'actif brut
      new JournalLine(compteBilan.accountId, 0, immo.valeurBrute),
    ];

    if (cumulComptabilise > 0) {
      lines.push(new JournalLine(compteAmort.accountId, cumulComptabilise, 0));
    }

    // Plus ou moins-value
    if (plusMoinsValue > 0) {
      // Produit de cession 775
      const compte775 = findAccount('775');
      if (!compte775) throw new NotFoundException('Compte 775 (Produit de cession) introuvable');
      lines.push(new JournalLine(compte775.accountId, prixCession, 0));
      lines.push(new JournalLine(compte775.accountId, 0, plusMoinsValue + prixCession));
    } else if (plusMoinsValue < 0) {
      // Charge de cession 675
      const compte675 = findAccount('675');
      if (!compte675) throw new NotFoundException('Compte 675 (Valeur nette comptable cédée) introuvable');
      lines.push(new JournalLine(compte675.accountId, -plusMoinsValue, 0));
      if (prixCession > 0) {
        const compte462 = findAccount('462');
        if (compte462) lines.push(new JournalLine(compte462.accountId, prixCession, 0));
      }
    }

    const entry = new JournalEntry(
      dateCession,
      `Cession immobilisation ${immo.libelle}`,
      lines,
    );

    const created = await this.jeRepo.createJournalEntry(entry, undefined, userId);
    await this.immoRepo.setStatutCede(id, dateCession, prixCession, userId);

    return { journalEntryId: created.id!, plusMoinsValue };
  }
}
