import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LigneRecurrenteDto {
  @ApiProperty() @IsInt() @Min(1) accountId: number;
  @ApiProperty() @IsInt() @Min(0) debit: number;
  @ApiProperty() @IsInt() @Min(0) credit: number;
  @ApiPropertyOptional() @IsOptional() @IsString() codeTva?: string;
}

export class CreerRecurrenteDto {
  @ApiProperty() @IsString() @IsNotEmpty() label: string;

  @ApiProperty({ enum: ['QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL'] })
  @IsEnum(['QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL'])
  frequence: string;

  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  prochainExecution: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) journalId?: number;

  @ApiProperty({ type: [LigneRecurrenteDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => LigneRecurrenteDto)
  lignes: LigneRecurrenteDto[];
}

export class ModifierRecurrenteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() label?: string;

  @ApiPropertyOptional({ enum: ['QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL'] })
  @IsOptional()
  @IsEnum(['QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL'])
  frequence?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() prochainExecution?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() actif?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) journalId?: number;

  @ApiPropertyOptional({ type: [LigneRecurrenteDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => LigneRecurrenteDto)
  lignes?: LigneRecurrenteDto[];
}
