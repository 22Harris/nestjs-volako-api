import { Injectable } from '@nestjs/common';
import { OperationRepository } from '../../application/ports/operation.repository.interface';
import { Operation } from '../../domain/operation.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { OperationDto } from '../../interface/dtos/operation.dto';
import { OperationType } from '../../interface/types/operation.type';

@Injectable()
export class DbOperationsRepository implements OperationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(operation: OperationDto): Promise<Operation> {
    const createdOperation = await this.prisma.operation.create({
      data: {
        type: operation.type,
        date: new Date(operation.date),
        label: operation.label,
      },
    });

    return new Operation(
      createdOperation.type as OperationType,
      createdOperation.date,
      createdOperation.label,
      createdOperation.id,
    );
  }
}
