import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCentreAnalytiqueDto {
  @ApiProperty({ example: 'MKTG', description: 'Code unique du centre analytique' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Marketing', description: 'Libellé du centre' })
  @IsString()
  @IsNotEmpty()
  libelle!: string;
}

export class UpdateCentreAnalytiqueDto extends CreateCentreAnalytiqueDto {}

class AffectationItemDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  centreId!: number;

  @ApiProperty({ description: 'Pourcentage (1-100). La somme doit être égale à 100.' })
  @IsInt()
  @Min(1)
  @Max(100)
  pourcentage!: number;
}

export class AffecterLignesDto {
  @ApiProperty({ description: 'ID de la ligne de journal à ventiler' })
  @IsInt()
  @Min(1)
  journalLineId!: number;

  @ApiProperty({ type: [AffectationItemDto] })
  @ValidateNested({ each: true })
  @Type(() => AffectationItemDto)
  affectations!: AffectationItemDto[];
}

export class BalanceQueryDto {
  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}
