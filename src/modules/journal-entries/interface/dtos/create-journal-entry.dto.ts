import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateJournalLineDto } from './create-journal-line.dto';

export class CreateJournalEntryDto {
  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsInt()
  operationId?: number;

  @IsOptional()
  @IsInt()
  journalId?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines: CreateJournalLineDto[];
}
