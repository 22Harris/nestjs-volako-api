import { Injectable } from '@nestjs/common';
import { JournalEntryRepository } from '../../application/ports/journal-entries.repository.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { JournalEntry } from '../../domain/entities/journal-entries.entity';
import { JournalLine } from '../../domain/entities/journal-line.entity';

@Injectable()
export class DbJournalEntryRepository implements JournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(journal: any): JournalEntry {
    return new JournalEntry(
      journal.date,
      journal.label,
      journal.lines.map(
        (line: any) => new JournalLine(line.accountId, line.debit, line.credit, line.id),
      ),
      journal.id,
      journal.operationId ?? undefined,
    );
  }

  async createJournalEntry(journal: JournalEntry, operationId?: number): Promise<JournalEntry> {
    const row = await this.prisma.journalEntry.create({
      data: {
        date: journal.date,
        label: journal.label,
        operationId: operationId ?? null,
        lines: {
          create: journal.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: { lines: true },
    });
    return this.toEntity(row);
  }

  async findJournalEntries(operationId?: number): Promise<JournalEntry[]> {
    const rows = await this.prisma.journalEntry.findMany({
      where: operationId !== undefined ? { operationId } : undefined,
      include: { lines: true },
      orderBy: { date: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async getJournalById(journalId: number): Promise<JournalEntry | null> {
    const row = await this.prisma.journalEntry.findUnique({
      where: { id: journalId },
      include: { lines: true },
    });
    if (!row) return null;
    return this.toEntity(row);
  }

  async updateLabelOfJournalEntry(journalId: number, label: string): Promise<JournalEntry> {
    const row = await this.prisma.journalEntry.update({
      where: { id: journalId },
      data: { label },
      include: { lines: true },
    });
    return this.toEntity(row);
  }

  async deleteJournalEntry(journalId: number): Promise<void> {
    await this.prisma.journalLine.deleteMany({ where: { entryId: journalId } });
    await this.prisma.journalEntry.delete({ where: { id: journalId } });
  }
}
