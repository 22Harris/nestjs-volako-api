import { IsString, IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateFactureDto {
  @IsString() @IsNotEmpty()
  numero: string;

  @IsDateString()
  date: string;

  @IsOptional() @IsDateString()
  dateEcheance?: string;

  @IsInt() @IsPositive()
  montant: number;

  @IsOptional() @IsString() @IsIn(['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE'])
  statut?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsInt() @IsPositive()
  tiersId: number;
}
