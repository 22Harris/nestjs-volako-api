import { IsDateString } from 'class-validator/types/decorator/string/IsDateString';
import { OperationType } from '../types/operation.type';
import { IsString } from 'class-validator';

export class CreateOperationDto {
  type: OperationType;

  @IsDateString()
  date: string;

  @IsString()
  label: string;

  lines: {
    accountId: number;
    debit: number;
    credit: number;
  }[];
}
