import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { JournalEntry } from '../../domain/entities/journal-entries.entity';
import { PERIODE_LOCKS } from '../../../periode-locks/application/ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../../../periode-locks/application/ports/periode-locks.repository.interface';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class UpdateLabelOfJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly journalEntryRepository: JournalEntryRepository,
    @Inject(PERIODE_LOCKS)
    private readonly periodeLocksRepository: PeriodeLocksRepository,
  ) {}

  async execute(journalId: number, label: string, userId: number, role: Role): Promise<JournalEntry> {
    const meta = await this.journalEntryRepository.getEntryMeta(journalId);
    if (!meta) throw new NotFoundException(`Écriture ${journalId} introuvable`);

    if (meta.statut === 'VERROUILLE') {
      throw new ForbiddenException('Impossible de modifier une écriture verrouillée');
    }
    if (role === Role.ASSISTANT) {
      if (meta.userId !== userId) throw new ForbiddenException('Un assistant ne peut modifier que ses propres écritures');
      if (meta.statut !== 'BROUILLON') throw new ForbiddenException('Un assistant ne peut modifier que ses écritures en brouillon');
    }

    const annee = meta.date.getFullYear();
    const mois = meta.date.getMonth() + 1;
    const locked = await this.periodeLocksRepository.isLocked(annee, mois, userId);
    if (locked) throw new ForbiddenException(`La période ${mois}/${annee} est verrouillée`);

    return this.journalEntryRepository.updateLabelOfJournalEntry(journalId, label, userId);
  }
}
