import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, IsIn } from 'class-validator';

export class CreateTiersDto {
  @IsString() @IsNotEmpty()
  nom: string;

  @IsString() @IsIn(['CLIENT', 'FOURNISSEUR'])
  type: string;

  @IsOptional() @IsString()
  siret?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  telephone?: string;

  @IsOptional() @IsString()
  adresse?: string;

  @IsOptional() @IsInt() @IsPositive()
  accountId?: number;
}
