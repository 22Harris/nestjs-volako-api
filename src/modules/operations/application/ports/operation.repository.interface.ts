import { Operation } from '../../domain/operation.entity';
import { OperationDto } from '../../interface/dtos/operation.dto';
import { OperationType } from '../../interface/types/operation.type';

export interface OperationFilter {
  type?: OperationType;
  dateFrom?: string;
  dateTo?: string;
}

export interface OperationRepository {
  create(operation: OperationDto): Promise<Operation>;
  findAll(filter?: OperationFilter): Promise<Operation[]>;
  findById(id: number): Promise<Operation | null>;
  update(id: number, data: Partial<OperationDto>): Promise<Operation>;
  delete(id: number): Promise<void>;
}
