import { Inject, Injectable } from '@nestjs/common';
import { JOURNALS } from '../ports/journals.token';
import type { JournalsRepository } from '../ports/journals.repository.interface';
import { Journal } from '../../domain/entities/journal.entity';

@Injectable()
export class FindJournalsUseCase {
  constructor(@Inject(JOURNALS) private readonly repo: JournalsRepository) {}
  execute(userId: number): Promise<Journal[]> {
    return this.repo.findAll(userId);
  }
}
