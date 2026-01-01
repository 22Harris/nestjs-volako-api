import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateJournalLineDto } from './create-journal-line.dto';

export class CreateJournalEntryDto {
  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines: CreateJournalLineDto[];
}
