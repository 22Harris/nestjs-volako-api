import { Inject, Injectable } from '@nestjs/common';
import { OPERATIONS_REPOSITORY } from '../ports/operation.repository.token';
import type { OperationRepository } from '../ports/operation.repository.interface';
import { CreateOperationDto } from '../../interface/dtos/create-operation.dto';
import { Operation } from '../../domain/operation.entity';
import { CreateJournalEntryUseCase } from 'src/modules/journal-entries/application/use-cases/create-journal-entry.usecase';
import { OperationDto } from '../../interface/dtos/operation.dto';
import { JournalLineFactory } from '../../domain/journal_line_factory';
import { CreateJournalEntryDto } from 'src/modules/journal-entries/interface/dtos/create-journal-entry.dto';
import type { AccountRepository } from 'src/modules/accounts/application/ports/accounts.repository.interface';
import { ACCOUNTS_REPOSITORY } from 'src/modules/accounts/application/ports/accounts.repository.token';

@Injectable()
export class CreateOperationUseCase {
  constructor(
    @Inject(OPERATIONS_REPOSITORY)
    private readonly operationRepository: OperationRepository,
    private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(operationMaster: CreateOperationDto): Promise<Operation> {
    const operation: OperationDto = {
      type: operationMaster.type,
      date: operationMaster.date,
      label: operationMaster.label,
      amount: operationMaster.amount,
    };
    const operationCreated = await this.operationRepository.create(operation);

    const journalLines = await JournalLineFactory.generateJournalLines(
      operationMaster,
      this.accountRepository,
    );

    const journalEntry: CreateJournalEntryDto = {
      date: operationMaster.date,
      label: operationMaster.label,
      lines: journalLines,
    };

    await this.createJournalEntryUseCase.execute(journalEntry);

    return operationCreated;
  }
}
