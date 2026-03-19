import { IsString, IsInt, IsPositive, IsDateString, IsOptional, IsIn } from 'class-validator';

export class UpdateFactureDto {
  @IsOptional() @IsString()
  numero?: string;

  @IsOptional() @IsDateString()
  date?: string;

  @IsOptional() @IsDateString()
  dateEcheance?: string;

  @IsOptional() @IsInt() @IsPositive()
  montant?: number;

  @IsOptional() @IsString() @IsIn(['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE'])
  statut?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsInt() @IsPositive()
  tiersId?: number;
}
