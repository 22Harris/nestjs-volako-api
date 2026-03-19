import { IsInt, Min, Max } from 'class-validator';

export class CreateFiscalYearDto {
  @IsInt()
  @Min(1900)
  @Max(2100)
  annee: number;
}
