import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertCompanyInfoDto {
  @ApiProperty({ example: 'SARL Volako' })
  @IsString()
  nom!: string;

  @ApiPropertyOptional({ example: '12345678901234', description: 'SIRET (14 chiffres)' })
  @IsOptional()
  @Matches(/^\d{14}$/, { message: 'Le SIRET doit contenir exactement 14 chiffres' })
  siret?: string;

  @ApiPropertyOptional({ example: 'FR12345678901', description: 'N° TVA intracommunautaire' })
  @IsOptional()
  @IsString()
  numTva?: string;

  @ApiPropertyOptional({ example: '12 rue de la Paix, 75001 Paris' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: 'contact@volako.fr' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'FR76 3000 4000 0300 0000 0003 43' })
  @IsOptional()
  @IsString()
  iban?: string;
}
