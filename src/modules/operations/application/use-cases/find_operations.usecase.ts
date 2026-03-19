import { Inject, Injectable } from '@nestjs/common';
import { OPERATIONS_REPOSITORY } from '../ports/operation.repository.token';
import type { OperationFilter, OperationRepository } from '../ports/operation.repository.interface';
import { Operation } from '../../domain/operation.entity';

@Injectable()
export class FindOperationsUseCase {
  constructor(
    @Inject(OPERATIONS_REPOSITORY)
    private readonly repo: OperationRepository,
  ) {}

  execute(userId: number, filter?: OperationFilter): Promise<Operation[]> {
    return this.repo.findAll(userId, filter);
  }
}
