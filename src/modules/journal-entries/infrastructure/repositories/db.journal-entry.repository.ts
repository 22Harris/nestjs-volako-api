import { Injectable } from '@nestjs/common';
import { JournalEntryRepository } from '../../application/ports/journal-entries.repository.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { JournalEntry } from '../../domain/entities/journal-entries.entity';
import { JournalLine } from '../../domain/entities/journal-line.entity';

@Injectable()
export class DbJournalEntryRepository implements JournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJournalEntry(
    journal: JournalEntry,
    operationId?: number,
  ): Promise<JournalEntry> {
    const journalEntry = await this.prisma.journalEntry.create({
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
      include: {
        lines: true,
      },
    });

    return new JournalEntry(
      journalEntry.date,
      journalEntry.label,
      journalEntry.lines.map(
        (line) =>
          new JournalLine(line.accountId, line.debit, line.credit, line.id),
      ),
      journalEntry.id,
    );
  }

  async findJournalEntries(): Promise<JournalEntry[]> {
    const journalEntries = await this.prisma.journalEntry.findMany({
      include: {
        lines: true,
      },
    });

    return journalEntries.map(
      (journal) =>
        new JournalEntry(
          journal.date,
          journal.label,
          journal.lines.map(
            (line) =>
              new JournalLine(line.accountId, line.debit, line.credit, line.id),
          ),
          journal.id,
        ),
    );
  }

  async getJournalById(journalId: number): Promise<JournalEntry | null> {
    const journal = await this.prisma.journalEntry.findUnique({
      where: {
        id: journalId,
      },
      include: {
        lines: true,
      },
    });

    if (!journal) {
      return null;
    }

    return new JournalEntry(
      journal.date,
      journal.label,
      journal.lines.map(
        (line) =>
          new JournalLine(line.accountId, line.debit, line.credit, line.id),
      ),
      journal.id,
    );
  }

  async updateLabelOfJournalEntry(
    journalId: number,
    label: string,
  ): Promise<JournalEntry> {
    const journal = await this.prisma.journalEntry.update({
      where: {
        id: journalId,
      },
      data: {
        label: label,
      },
      include: {
        lines: true,
      },
    });

    return new JournalEntry(
      journal.date,
      journal.label,
      journal.lines.map(
        (line) =>
          new JournalLine(line.accountId, line.debit, line.credit, line.id),
      ),
      journal.id,
    );
  }
}
