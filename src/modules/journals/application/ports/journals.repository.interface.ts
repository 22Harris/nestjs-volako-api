import { Journal } from '../../domain/entities/journal.entity';
import { JournalType } from '@prisma/client';

export interface JournalsRepository {
  findAll(userId: number): Promise<Journal[]>;
  findByType(type: JournalType, userId: number): Promise<Journal | null>;
  create(type: JournalType, userId: number): Promise<Journal>;
  getOrCreate(type: JournalType, userId: number): Promise<Journal>;
}
