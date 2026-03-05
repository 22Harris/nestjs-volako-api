import { Inject, Injectable } from '@nestjs/common';
import { OPERATIONS_REPOSITORY } from '../ports/operation.repository.token';
import type { OperationRepository } from '../ports/operation.repository.interface';

@Injectable()
export class DeleteOperationUseCase {
  constructor(
    @Inject(OPERATIONS_REPOSITORY)
    private readonly repo: OperationRepository,
  ) {}

  execute(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}
