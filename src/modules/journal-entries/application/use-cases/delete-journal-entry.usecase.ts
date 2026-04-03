import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { PERIODE_LOCKS } from '../../../periode-locks/application/ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../../../periode-locks/application/ports/periode-locks.repository.interface';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class DeleteJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
    @Inject(PERIODE_LOCKS)
    private readonly periodeLocksRepository: PeriodeLocksRepository,
  ) {}

  async execute(id: number, userId: number, role: Role): Promise<void> {
    const meta = await this.repo.getEntryMeta(id);
    if (!meta) throw new NotFoundException(`Écriture ${id} introuvable`);

    if (meta.statut === 'VERROUILLE') {
      throw new ForbiddenException('Impossible de supprimer une écriture verrouillée');
    }
    if (role === Role.ASSISTANT) {
      if (meta.userId !== userId) throw new ForbiddenException('Un assistant ne peut supprimer que ses propres écritures');
      if (meta.statut !== 'BROUILLON') throw new ForbiddenException('Un assistant ne peut supprimer que ses écritures en brouillon');
    }

    const annee = meta.date.getFullYear();
    const mois = meta.date.getMonth() + 1;
    const locked = await this.periodeLocksRepository.isLocked(annee, mois, userId);
    if (locked) throw new ForbiddenException(`La période ${mois}/${annee} est verrouillée`);

    return this.repo.deleteJournalEntry(id, userId);
  }
}
