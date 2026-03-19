import { IsInt, Min, Max } from 'class-validator';

export class LockPeriodDto {
  @IsInt()
  @Min(1900)
  annee: number;

  @IsInt()
  @Min(1)
  @Max(12)
  mois: number;
}
