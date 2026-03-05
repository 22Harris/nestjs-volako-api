import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateEvenementDto {
  @IsString() titre: string;
  @IsString() categorie: string;
  @IsInt() @Min(0) montant: number;
  @IsDateString() dateEcheance: string;
  @IsString() recurrence: string;
  @IsString() statut: string;
  @IsOptional() @IsString() notes?: string;
}
