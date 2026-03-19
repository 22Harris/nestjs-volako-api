import { IsString, IsInt, IsPositive, IsDateString, IsOptional, IsIn } from 'class-validator';

export class AddPaiementDto {
  @IsDateString()
  date: string;

  @IsInt() @IsPositive()
  montant: number;

  @IsString() @IsIn(['VIREMENT', 'CHEQUE', 'ESPECES', 'CARTE', 'PRELEVEMENT'])
  mode: string;

  @IsOptional() @IsString()
  reference?: string;
}
