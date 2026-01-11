import { Operation } from '../../domain/operation.entity';
import { OperationDto } from '../../interface/dtos/operation.dto';

export interface OperationRepository {
  create(operation: OperationDto): Promise<Operation>;
}
