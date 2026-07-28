import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class ValiderJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
    private readonly auditLog: AuditLogService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const meta = await this.repo.getEntryMeta(id);
    if (!meta) throw new NotFoundException(`Écriture ${id} introuvable`);
    if (meta.statut !== 'BROUILLON') {
      throw new BadRequestException(`Seule une écriture en BROUILLON peut être validée (statut actuel : ${meta.statut})`);
    }
    await this.repo.updateStatut(id, 'VALIDE');
    await this.auditLog.log({ userId, action: 'ENTRY_VALIDE', entity: 'JournalEntry', entityId: id });
    // Invalider le cache de la balance pour cet utilisateur
    await this.cache.del(`balance:${userId}`);
  }
}
