import { IsInt, Max, Min } from 'class-validator';
export class CreateBudgetDto {
  @IsInt() exercice: number;
  @IsInt() @Min(1) @Max(12) mois: number;
}
