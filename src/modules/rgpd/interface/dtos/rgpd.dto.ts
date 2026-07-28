import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum TypeDemandeDto {
  ACCES = 'ACCES',
  EFFACEMENT = 'EFFACEMENT',
  PORTABILITE = 'PORTABILITE',
  RECTIFICATION = 'RECTIFICATION',
}

export class CreerDemandeDto {
  @ApiProperty({ enum: TypeDemandeDto })
  @IsEnum(TypeDemandeDto)
  type!: TypeDemandeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class TraiterDemandeDto {
  @ApiProperty({ enum: ['TRAITEE', 'REFUSEE'] })
  @IsEnum(['TRAITEE', 'REFUSEE'])
  statut!: 'TRAITEE' | 'REFUSEE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class PurgeAuditDto {
  @ApiProperty({ description: 'Purger les logs antérieurs à N jours (min 90)', example: 365 })
  @IsInt()
  @Min(90)
  olderThanDays!: number;
}
