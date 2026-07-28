import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@Injectable()
export class VerrouillerJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const meta = await this.repo.getEntryMeta(id);
    if (!meta) throw new NotFoundException(`Écriture ${id} introuvable`);
    if (meta.statut !== 'VALIDE') {
      throw new BadRequestException(`Seule une écriture VALIDÉE peut être verrouillée (statut actuel : ${meta.statut})`);
    }
    await this.repo.updateStatut(id, 'VERROUILLE');
    await this.auditLog.log({ userId, action: 'ENTRY_VERROUILLE', entity: 'JournalEntry', entityId: id });
  }
}
