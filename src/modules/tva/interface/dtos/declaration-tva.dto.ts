import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreerDeclarationTvaDto {
  @ApiProperty({ example: '2026-01-01', description: 'Début de la période (ISO 8601)' })
  @IsDateString()
  dateFrom!: string;

  @ApiProperty({ example: '2026-03-31', description: 'Fin de la période (ISO 8601)' })
  @IsDateString()
  dateTo!: string;

  @ApiProperty({ example: '2026-T1', description: 'Libellé de la période (ex: 2026-01, 2026-T1)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}(-\d{2}|-T[1-4])$/, {
    message: 'Période invalide — attendu : YYYY-MM ou YYYY-T1..T4',
  })
  periode!: string;
}
