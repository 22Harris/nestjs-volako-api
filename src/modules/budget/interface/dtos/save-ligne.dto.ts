import { IsInt, IsOptional, IsString, Min } from 'class-validator';
export class SaveLigneDto {
  @IsOptional() @IsInt() id?: number;
  @IsString() categorie: string;
  @IsString() libelle: string;
  @IsInt() @Min(0) montantPrevu: number;
  @IsString() type: string;
}
