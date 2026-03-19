import { Injectable } from '@nestjs/common';
import { JournalsRepository } from '../../application/ports/journals.repository.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Journal } from '../../domain/entities/journal.entity';
import { JournalType } from '@prisma/client';

@Injectable()
export class DbJournalsRepository implements JournalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: any): Journal {
    return new Journal(row.type, row.userId, row.id);
  }

  findAll(userId: number): Promise<Journal[]> {
    return this.prisma.journal
      .findMany({ where: { userId }, orderBy: { type: 'asc' } })
      .then((rows) => rows.map((r) => this.toEntity(r)));
  }

  findByType(type: JournalType, userId: number): Promise<Journal | null> {
    return this.prisma.journal
      .findUnique({ where: { type_userId: { type, userId } } })
      .then((r) => (r ? this.toEntity(r) : null));
  }

  create(type: JournalType, userId: number): Promise<Journal> {
    return this.prisma.journal.create({ data: { type, userId } }).then((r) => this.toEntity(r));
  }

  async getOrCreate(type: JournalType, userId: number): Promise<Journal> {
    const existing = await this.findByType(type, userId);
    if (existing) return existing;
    return this.create(type, userId);
  }
}
