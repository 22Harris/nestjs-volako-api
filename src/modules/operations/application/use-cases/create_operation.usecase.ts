import { Inject, Injectable } from '@nestjs/common';
import { OPERATIONS_REPOSITORY } from '../ports/operation.repository.token';
import type { OperationRepository } from '../ports/operation.repository.interface';
import { CreateOperationDto } from '../../interface/dtos/create-operation.dto';
import { Operation } from '../../domain/operation.entity';
import { CreateJournalEntryUseCase } from 'src/modules/journal-entries/application/use-cases/create-journal-entry.usecase';

@Injectable()
export class CreateOperationUseCase {
  constructor(
    @Inject(OPERATIONS_REPOSITORY)
    private readonly operationRepository: OperationRepository,
    private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
  ) {}
  async execute(operation: CreateOperationDto): Promise<Operation> {
    const operationCreated = await this.operationRepository.create(operation);

    const journalEntryDto = {
      date: operation.date,
      label: operation.label,
      lines: operation.lines,
    };
    const journalEntryCreated = await this.createJournalEntryUseCase.execute(
      journalEntryDto,
      operationCreated.id,
    );

    return operationCreated;
  }
}
