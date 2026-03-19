import { IsString, IsOptional, IsInt, IsPositive, IsIn } from 'class-validator';

export class UpdateTiersDto {
  @IsOptional() @IsString()
  nom?: string;

  @IsOptional() @IsString() @IsIn(['CLIENT', 'FOURNISSEUR'])
  type?: string;

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
