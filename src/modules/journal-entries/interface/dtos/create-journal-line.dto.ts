import { IsInt, Min } from 'class-validator';

export class CreateJournalLineDto {
  @IsInt()
  @Min(0)
  debit: number;

  @IsInt()
  @Min(0)
  credit: number;

  @IsInt()
  accountId: number;
}
