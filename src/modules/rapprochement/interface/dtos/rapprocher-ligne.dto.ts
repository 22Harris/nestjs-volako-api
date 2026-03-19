import { IsInt, IsPositive } from 'class-validator';

export class RapprocherLigneDto {
  @IsInt()
  @IsPositive()
  journalLineId!: number;
}
