import { Operation } from '../../domain/operation.entity';
import { OperationDto } from '../../interface/dtos/operation.dto';
import { OperationType } from '../../interface/types/operation.type';

export interface OperationFilter {
  type?: OperationType;
  dateFrom?: string;
  dateTo?: string;
}

export interface OperationRepository {
  create(operation: OperationDto, userId: number): Promise<Operation>;
  findAll(userId: number, filter?: OperationFilter): Promise<Operation[]>;
  findById(id: number, userId: number): Promise<Operation | null>;
  update(id: number, data: Partial<OperationDto>, userId: number): Promise<Operation>;
  delete(id: number, userId: number): Promise<void>;
}
