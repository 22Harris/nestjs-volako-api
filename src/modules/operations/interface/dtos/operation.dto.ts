import { OperationType } from '../types/operation.type';

export class OperationDto {
  type: OperationType;
  date: string;
  label: string;
}
