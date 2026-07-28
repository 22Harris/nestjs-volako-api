import { Injectable } from '@nestjs/common';
import { AccountBalance, EntryMeta, JournalEntryRepository, LineForLettrage } from '../../application/ports/journal-entries.repository.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedResult, toPaginated } from '../../../../common/dto/paginated.js';
import { EntryStatus, JournalEntry } from '../../domain/entities/journal-entries.entity';
import { JournalLine } from '../../domain/entities/journal-line.entity';

@Injectable()
export class DbJournalEntryRepository implements JournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(journal: any): JournalEntry {
    return new JournalEntry(
      journal.date,
      journal.label,
      journal.lines.map((line: any) => new JournalLine(line.accountId, line.debit, line.credit, line.id, line.codeTva ?? undefined)),
      journal.id,
      journal.operationId ?? undefined,
      journal.journalId ?? undefined,
      journal.pieceNumber ?? undefined,
      journal.statut ?? 'BROUILLON',
      journal.userId ?? undefined,
    );
  }

  private readonly prefixMap: Record<string, string> = {
    ACHATS: 'AC', VENTES: 'VT', BANQUE: 'BQ', CAISSE: 'CA', OD: 'OD',
  };

  /** Incrémente atomiquement le compteur (upsert PostgreSQL) et retourne le prochain numéro de pièce. */
  async nextPieceNumber(journalDbId: number, year: number, prefix: string): Promise<string> {
    const rows = await this.prisma.$queryRaw<[{ lastSeq: number }]>`
      INSERT INTO "JournalSequence" ("journalId", "year", "lastSeq")
      VALUES (${journalDbId}::int, ${year}::int, 1)
      ON CONFLICT ("journalId", "year") DO UPDATE
        SET "lastSeq" = "JournalSequence"."lastSeq" + 1
      RETURNING "lastSeq"
    `;
    return `${prefix}-${year}-${String(rows[0].lastSeq).padStart(5, '0')}`;
  }

  async createJournalEntry(journal: JournalEntry, operationId: number | undefined, userId: number, journalDbId?: number): Promise<JournalEntry> {
    const year = journal.date.getFullYear();

    const row = await this.prisma.$transaction(async (tx) => {
      let resolvedJournalId = journalDbId;
      let prefix = 'OD';

      if (resolvedJournalId === undefined) {
        let odJournal = await tx.journal.findFirst({ where: { userId, type: 'OD' } });
        odJournal ??= await tx.journal.create({ data: { type: 'OD', userId } });
        resolvedJournalId = odJournal.id;
      } else {
        const jRow = await tx.journal.findUnique({ where: { id: resolvedJournalId } });
        if (jRow) prefix = this.prefixMap[jRow.type] ?? 'OD';
      }

      const pieceRows = await tx.$queryRaw<[{ lastSeq: number }]>`
        INSERT INTO "JournalSequence" ("journalId", "year", "lastSeq")
        VALUES (${resolvedJournalId}::int, ${year}::int, 1)
        ON CONFLICT ("journalId", "year") DO UPDATE
          SET "lastSeq" = "JournalSequence"."lastSeq" + 1
        RETURNING "lastSeq"
      `;
      const pieceNumber = `${prefix}-${year}-${String(pieceRows[0].lastSeq).padStart(5, '0')}`;

      return tx.journalEntry.create({
        data: {
          date: journal.date,
          label: journal.label,
          pieceNumber,
          operationId: operationId ?? null,
          journalId: resolvedJournalId,
          userId,
          lines: {
            create: journal.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              codeTva: line.codeTva ?? null,
            })),
          },
        },
        include: { lines: true },
      });
    });

    return this.toEntity(row);
  }

  async findJournalEntries(userId: number, operationId?: number, journalId?: number, page = 1, pageSize = 50): Promise<PaginatedResult<JournalEntry>> {
    const where = {
      userId,
      ...(operationId !== undefined && { operationId }),
      ...(journalId !== undefined && { journalId }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: { lines: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);
    return toPaginated(rows.map((r) => this.toEntity(r)), total, page, pageSize);
  }

  async getJournalById(journalId: number, userId: number): Promise<JournalEntry | null> {
    const row = await this.prisma.journalEntry.findFirst({
      where: { id: journalId, userId },
      include: { lines: true },
    });
    if (!row) return null;
    return this.toEntity(row);
  }

  async updateLabelOfJournalEntry(journalId: number, label: string, userId: number): Promise<JournalEntry> {
    const row = await this.prisma.journalEntry.update({
      where: { id: journalId, userId },
      data: { label },
      include: { lines: true },
    });
    return this.toEntity(row);
  }

  async deleteJournalEntry(journalId: number, userId: number): Promise<void> {
    await this.prisma.journalLine.deleteMany({ where: { entryId: journalId } });
    await this.prisma.journalEntry.delete({ where: { id: journalId, userId } });
  }

  /** Génère la prochaine lettre disponible (A, B, ..., Z, AA, AB, ...) pour un compte donné */
  private async nextLettre(accountId: number, userId: number): Promise<string> {
    const existing = await this.prisma.journalLine.findMany({
      where: { accountId, entry: { userId }, lettre: { not: null } },
      select: { lettre: true },
      distinct: ['lettre'],
    });
    const used = new Set(existing.map(l => l.lettre as string));

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // Séquence : A, B, ..., Z, AA, AB, ..., AZ, BA, ...
    for (let len = 1; ; len++) {
      const total = Math.pow(26, len);
      for (let i = 0; i < total; i++) {
        let idx = i;
        let candidate = '';
        for (let pos = 0; pos < len; pos++) {
          candidate = letters[idx % 26] + candidate;
          idx = Math.floor(idx / 26);
        }
        if (!used.has(candidate)) return candidate;
      }
    }
  }

  async lettrerLignes(lineIds: number[], userId: number): Promise<string> {
    const lines = await this.prisma.journalLine.findMany({
      where: { id: { in: lineIds }, entry: { userId } },
      select: { id: true, accountId: true, debit: true, credit: true, lettre: true },
    });

    if (lines.length !== lineIds.length) {
      throw new Error('Une ou plusieurs lignes sont introuvables ou n\'appartiennent pas à cet utilisateur');
    }
    const accountIds = new Set(lines.map(l => l.accountId));
    if (accountIds.size > 1) {
      throw new Error('Toutes les lignes doivent appartenir au même compte pour le lettrage');
    }
    const netBalance = lines.reduce((s, l) => s + l.debit - l.credit, 0);
    if (netBalance !== 0) {
      throw new Error(`Les lignes ne s'équilibrent pas (solde net = ${netBalance} centimes)`);
    }

    const accountId = lines[0].accountId;
    const lettre = await this.nextLettre(accountId, userId);
    await this.prisma.journalLine.updateMany({ where: { id: { in: lineIds } }, data: { lettre } });
    return lettre;
  }

  async deletterLignes(lineIds: number[], userId: number): Promise<void> {
    await this.prisma.journalLine.updateMany({
      where: { id: { in: lineIds }, entry: { userId } },
      data: { lettre: null },
    });
  }

  async getEntryMeta(id: number): Promise<EntryMeta | null> {
    const row = await this.prisma.journalEntry.findUnique({
      where: { id },
      select: { id: true, statut: true, userId: true, date: true },
    });
    if (!row) return null;
    return { id: row.id, statut: row.statut, userId: row.userId, date: row.date };
  }

  async updateStatut(id: number, statut: EntryStatus): Promise<void> {
    await this.prisma.journalEntry.update({ where: { id }, data: { statut } });
  }

  async getUnletteredLines(accountId: number, userId: number): Promise<LineForLettrage[]> {
    const rows = await this.prisma.journalLine.findMany({
      where: { accountId, lettre: null, entry: { userId } },
      include: { entry: true },
      orderBy: { entry: { date: 'asc' } },
    });
    return rows.map(r => ({
      id: r.id,
      debit: r.debit,
      credit: r.credit,
      lettre: null,
      date: r.entry.date,
      entryLabel: r.entry.label,
      pieceNumber: r.entry.pieceNumber ?? null,
    }));
  }

  async getLinesForAccount(accountId: number, userId: number): Promise<LineForLettrage[]> {
    const rows = await this.prisma.journalLine.findMany({
      where: { accountId, entry: { userId } },
      include: { entry: true },
      orderBy: [{ lettre: 'asc' }, { entry: { date: 'asc' } }],
    });
    return rows.map(r => ({
      id: r.id,
      debit: r.debit,
      credit: r.credit,
      lettre: r.lettre ?? null,
      date: r.entry.date,
      entryLabel: r.entry.label,
      pieceNumber: r.entry.pieceNumber ?? null,
    }));
  }

  async getAccountBalances(userId: number, dateFrom?: Date, dateTo?: Date): Promise<AccountBalance[]> {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: {
          userId,
          date: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        },
      },
      include: { account: true },
    });

    const balances = new Map<number, AccountBalance>();
    for (const line of lines) {
      if (!balances.has(line.accountId)) {
        balances.set(line.accountId, {
          accountId: line.accountId,
          accountCode: line.account.code,
          accountName: line.account.name,
          totalDebit: 0,
          totalCredit: 0,
        });
      }
      const b = balances.get(line.accountId)!;
      b.totalDebit += line.debit;
      b.totalCredit += line.credit;
    }
    return [...balances.values()];
  }
}
