import { Inject, Injectable } from '@nestjs/common';
import { OPERATIONS_REPOSITORY } from '../ports/operation.repository.token';
import type { OperationRepository } from '../ports/operation.repository.interface';
import { Operation } from '../../domain/operation.entity';
import { OperationDto } from '../../interface/dtos/operation.dto';

@Injectable()
export class UpdateOperationUseCase {
  constructor(
    @Inject(OPERATIONS_REPOSITORY)
    private readonly repo: OperationRepository,
  ) {}

  execute(id: number, data: Partial<OperationDto>): Promise<Operation> {
    return this.repo.update(id, data);
  }
}
