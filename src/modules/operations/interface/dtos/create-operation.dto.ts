import { IsDateString } from 'class-validator';
import { OperationType } from '../types/operation.type';
import { IsString } from 'class-validator';

export class CreateOperationDto {
  type: OperationType;

  @IsDateString()
  date: string;

  @IsString()
  label: string;

  amount: number;
}
