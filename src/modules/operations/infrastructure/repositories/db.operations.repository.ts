import { Injectable } from '@nestjs/common';
import { OperationFilter, OperationRepository } from '../../application/ports/operation.repository.interface';
import { Operation } from '../../domain/operation.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { OperationDto } from '../../interface/dtos/operation.dto';
import { OperationType } from '../../interface/types/operation.type';

@Injectable()
export class DbOperationsRepository implements OperationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: any): Operation {
    const entries = row.entries?.map((e: any) => ({
      id: e.id,
      date: e.date,
      label: e.label,
      lines: (e.lines ?? []).map((l: any) => ({ id: l.id, accountId: l.accountId, debit: l.debit, credit: l.credit })),
    }));
    return new Operation(row.type as OperationType, row.date, row.label, row.id, row.amount, entries);
  }

  async create(operation: OperationDto, userId: number): Promise<Operation> {
    const row = await this.prisma.operation.create({
      data: {
        type: operation.type,
        date: new Date(operation.date),
        label: operation.label,
        amount: operation.amount ?? 0,
        userId,
      },
    });
    return this.toEntity(row);
  }

  async findAll(userId: number, filter?: OperationFilter): Promise<Operation[]> {
    const rows = await this.prisma.operation.findMany({
      where: {
        userId,
        ...(filter?.type && { type: filter.type }),
        ...(filter?.dateFrom || filter?.dateTo ? {
          date: {
            ...(filter.dateFrom && { gte: new Date(filter.dateFrom) }),
            ...(filter.dateTo && { lte: new Date(filter.dateTo) }),
          },
        } : {}),
      },
      orderBy: { date: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: number, userId: number): Promise<Operation | null> {
    const row = await this.prisma.operation.findFirst({
      where: { id, userId },
      include: { entries: { include: { lines: true } } },
    });
    return row ? this.toEntity(row) : null;
  }

  async update(id: number, data: Partial<OperationDto>, userId: number): Promise<Operation> {
    const row = await this.prisma.operation.update({
      where: { id, userId },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.label && { label: data.label }),
        ...(data.amount !== undefined && { amount: data.amount }),
      },
    });
    return this.toEntity(row);
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.prisma.operation.delete({ where: { id, userId } });
  }
}
