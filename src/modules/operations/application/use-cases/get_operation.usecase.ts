import { Inject, Injectable } from '@nestjs/common';
import { OPERATIONS_REPOSITORY } from '../ports/operation.repository.token';
import type { OperationRepository } from '../ports/operation.repository.interface';
import { Operation } from '../../domain/operation.entity';

@Injectable()
export class GetOperationUseCase {
  constructor(
    @Inject(OPERATIONS_REPOSITORY)
    private readonly repo: OperationRepository,
  ) {}

  execute(id: number, userId: number): Promise<Operation | null> {
    return this.repo.findById(id, userId);
  }
}
