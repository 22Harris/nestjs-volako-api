import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';

@Injectable()
export class LettrerLignesUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly journalEntryRepository: JournalEntryRepository,
  ) {}

  async execute(lineIds: number[], userId: number): Promise<{ lettre: string }> {
    if (lineIds.length < 2) {
      throw new BadRequestException('Le lettrage nécessite au moins 2 lignes');
    }
    try {
      const lettre = await this.journalEntryRepository.lettrerLignes(lineIds, userId);
      return { lettre };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
