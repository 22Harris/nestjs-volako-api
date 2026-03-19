import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import type { CodeTva } from '../../domain/entities/journal-line.entity';

export class CreateJournalLineDto {
  @IsInt()
  @Min(0)
  debit: number;

  @IsInt()
  @Min(0)
  credit: number;

  @IsInt()
  accountId: number;

  @IsOptional()
  @IsEnum(['NORMAL_20', 'INTERMEDIAIRE_10', 'REDUIT_5_5', 'PARTICULIER_2_1', 'EXONERE', 'HORS_CHAMP'])
  codeTva?: CodeTva;
}
