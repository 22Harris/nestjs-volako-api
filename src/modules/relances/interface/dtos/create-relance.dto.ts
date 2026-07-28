import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRelanceDto {
  @ApiProperty({ description: 'ID de la facture en retard' })
  @IsInt()
  @Min(1)
  factureId!: number;

  @ApiPropertyOptional({ description: 'Note interne facultative' })
  @IsOptional()
  @IsString()
  note?: string;
}
