import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IMMOBILISATIONS_REPOSITORY } from '../ports/immobilisations.repository.token';
import type { ImmobilisationsRepository } from '../ports/immobilisations.repository.interface';
import { JOURNAL_ENTRIES } from 'src/modules/journal-entries/application/ports/journal-entries.token';
import type { JournalEntryRepository } from 'src/modules/journal-entries/application/ports/journal-entries.repository.interface';
import { JournalEntry } from 'src/modules/journal-entries/domain/entities/journal-entries.entity';
import { JournalLine } from 'src/modules/journal-entries/domain/entities/journal-line.entity';

@Injectable()
export class ComptabiliserDotationUseCase {
  constructor(
    @Inject(IMMOBILISATIONS_REPOSITORY)
    private readonly immoRepo: ImmobilisationsRepository,
    @Inject(JOURNAL_ENTRIES)
    private readonly jeRepo: JournalEntryRepository,
  ) {}

  async execute(immobilisationId: number, exercice: number, userId: number): Promise<{ journalEntryId: number }> {
    const immo = await this.immoRepo.findById(immobilisationId, userId);
    if (!immo) throw new NotFoundException('Immobilisation introuvable');
    if (immo.statut === 'CEDE') throw new BadRequestException('L\'immobilisation a été cédée');

    const ligne = immo.lignes.find(l => l.exercice === exercice);
    if (!ligne) throw new NotFoundException(`Aucune ligne d'amortissement pour l'exercice ${exercice}`);
    if (ligne.comptabilisee) throw new BadRequestException(`La dotation ${exercice} est déjà comptabilisée`);

    const balances = await this.jeRepo.getAccountBalances(userId);
    const chargeAccount = balances.find(a => a.accountCode === immo.compteChargeCode);
    const amortAccount = balances.find(a => a.accountCode === immo.compteAmortissementCode);

    if (!chargeAccount) throw new NotFoundException(`Compte de charge ${immo.compteChargeCode} introuvable`);
    if (!amortAccount) throw new NotFoundException(`Compte d'amortissement ${immo.compteAmortissementCode} introuvable`);

    const entry = new JournalEntry(
      new Date(exercice, 11, 31),
      `Dotation amortissement ${immo.libelle} - ${exercice}`,
      [
        new JournalLine(chargeAccount.accountId, ligne.dotation, 0),
        new JournalLine(amortAccount.accountId, 0, ligne.dotation),
      ],
    );

    const created = await this.jeRepo.createJournalEntry(entry, undefined, userId);
    await this.immoRepo.markDotationComptabilisee(immobilisationId, exercice, created.id!);

    return { journalEntryId: created.id! };
  }
}
