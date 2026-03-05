import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
export class CreateObjectifDto {
  @IsString() nom: string;
  @IsOptional() @IsString() description?: string;
  @IsString() categorie: string;
  @IsInt() @Min(0) montantCible: number;
  @IsInt() @Min(0) montantActuel: number;
  @IsDateString() dateDebut: string;
  @IsDateString() dateEcheance: string;
  @IsString() couleur: string;
  @IsString() icone: string;
  @IsString() statut: string;
}
