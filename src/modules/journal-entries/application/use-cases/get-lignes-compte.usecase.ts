import { Inject, Injectable } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository, LineForLettrage } from '../ports/journal-entries.repository.interface';

export interface LignesCompteResult {
  nonLettrees: LineForLettrage[];
  groupes: Record<string, LineForLettrage[]>;
}

@Injectable()
export class GetLignesCompteUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
  ) {}

  async execute(accountId: number, userId: number): Promise<LignesCompteResult> {
    const lines = await this.repo.getLinesForAccount(accountId, userId);

    const nonLettrees: LineForLettrage[] = [];
    const groupes: Record<string, LineForLettrage[]> = {};

    for (const line of lines) {
      if (!line.lettre) {
        nonLettrees.push(line);
      } else {
        if (!groupes[line.lettre]) groupes[line.lettre] = [];
        groupes[line.lettre].push(line);
      }
    }

    return { nonLettrees, groupes };
  }
}
