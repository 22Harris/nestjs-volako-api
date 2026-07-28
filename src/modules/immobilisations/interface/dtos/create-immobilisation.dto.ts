import { IsDateString, IsEnum, IsInt, IsPositive, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateImmobilisationDto {
  @ApiProperty({ example: 'Ordinateur portable Dell XPS' })
  @IsString()
  libelle!: string;

  @ApiProperty({ example: '2025-03-01' })
  @IsDateString()
  dateAcquisition!: string;

  @ApiProperty({ example: 150000, description: 'Valeur brute en centimes' })
  @IsInt()
  @IsPositive()
  valeurBrute!: number;

  @ApiProperty({ example: 5, description: 'Durée en années' })
  @IsInt()
  @Min(1)
  dureeAmortissement!: number;

  @ApiProperty({ enum: ['LINEAIRE', 'DEGRESSIF'], default: 'LINEAIRE' })
  @IsEnum(['LINEAIRE', 'DEGRESSIF'])
  methode!: 'LINEAIRE' | 'DEGRESSIF';

  @ApiProperty({ example: '2183', description: 'Compte bilan (21xx)' })
  @IsString()
  compteBilanCode!: string;

  @ApiProperty({ example: '2813', description: 'Compte amortissement (28xx)' })
  @IsString()
  compteAmortissementCode!: string;

  @ApiProperty({ example: '6811', description: 'Compte dotation (681x)' })
  @IsString()
  compteChargeCode!: string;
}
