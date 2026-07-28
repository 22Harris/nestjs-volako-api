import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitierAutorisationDto {
  @ApiProperty({ description: 'URL de redirection après autorisation bancaire' })
  @IsString() @IsNotEmpty() redirectUri: string;
}

export class EnregistrerCompteBankDto {
  @ApiProperty() @IsString() @IsNotEmpty() nom: string;
  @ApiProperty({ example: 'FR7630006000011234567890189' }) @IsString() @IsNotEmpty() iban: string;
  @ApiProperty({ example: 'mock', description: 'Identifiant du provider PSD2' }) @IsString() @IsNotEmpty() provider: string;
  @ApiProperty({ description: 'Code OAuth2 retourné par la banque' }) @IsString() @IsNotEmpty() code: string;
  @ApiProperty({ description: 'redirectUri utilisé lors du flux OAuth' }) @IsString() @IsNotEmpty() redirectUri: string;
}

export class SynchroniserDto {
  @ApiPropertyOptional({ description: 'Date de fin de la période (défaut: aujourd\'hui)', example: '2026-06-30' })
  @IsOptional() @IsDateString() dateTo?: string;
}
