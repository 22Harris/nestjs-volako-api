import { IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CederImmobilisationDto {
  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  dateCession!: string;

  @ApiProperty({ example: 80000, description: 'Prix de cession en centimes' })
  @IsInt()
  @Min(0)
  prixCession!: number;
}
