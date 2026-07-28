import { Body, Controller, Get, HttpCode, Put, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetCompanyInfoUseCase } from '../application/use-cases/get-company-info.usecase';
import { UpsertCompanyInfoUseCase } from '../application/use-cases/upsert-company-info.usecase';
import { UpsertCompanyInfoDto } from './dtos/upsert-company-info.dto';

@ApiTags('company-info')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('company-info')
export class CompanyInfoController {
  constructor(
    private readonly getUseCase: GetCompanyInfoUseCase,
    private readonly upsertUseCase: UpsertCompanyInfoUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir les informations de la société' })
  get(@CurrentUser() userId: number) {
    return this.getUseCase.execute(userId);
  }

  @Put()
  @HttpCode(200)
  @ApiOperation({ summary: 'Créer ou mettre à jour les informations de la société' })
  upsert(@Body() dto: UpsertCompanyInfoDto, @CurrentUser() userId: number) {
    return this.upsertUseCase.execute(dto, userId);
  }
}
