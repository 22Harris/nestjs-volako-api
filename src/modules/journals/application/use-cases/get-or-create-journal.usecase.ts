import { Inject, Injectable } from '@nestjs/common';
import { JOURNALS } from '../ports/journals.token';
import type { JournalsRepository } from '../ports/journals.repository.interface';
import { Journal } from '../../domain/entities/journal.entity';
import { JournalType } from '@prisma/client';

@Injectable()
export class GetOrCreateJournalUseCase {
  constructor(@Inject(JOURNALS) private readonly repo: JournalsRepository) {}
  execute(type: JournalType, userId: number): Promise<Journal> {
    return this.repo.getOrCreate(type, userId);
  }
}
