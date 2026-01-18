import { IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { OperationType } from '../types/operation.type';
import { IsString } from 'class-validator';

export class CreateOperationDto {
  @IsEnum(OperationType)
  type: OperationType;

  @IsDateString()
  date: string;

  @IsString()
  label: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
