import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateImmobilisationUseCase } from '../application/use-cases/create-immobilisation.usecase';
import { FindImmobilisationsUseCase } from '../application/use-cases/find-immobilisations.usecase';
import { GetImmobilisationUseCase } from '../application/use-cases/get-immobilisation.usecase';
import { ComptabiliserDotationUseCase } from '../application/use-cases/comptabiliser-dotation.usecase';
import { CederImmobilisationUseCase } from '../application/use-cases/ceder-immobilisation.usecase';
import { DeleteImmobilisationUseCase } from '../application/use-cases/delete-immobilisation.usecase';
import { CreateImmobilisationDto } from './dtos/create-immobilisation.dto';
import { CederImmobilisationDto } from './dtos/ceder-immobilisation.dto';

@ApiTags('immobilisations')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilisations')
export class ImmobilisationsController {
  constructor(
    private readonly createUseCase: CreateImmobilisationUseCase,
    private readonly findUseCase: FindImmobilisationsUseCase,
    private readonly getUseCase: GetImmobilisationUseCase,
    private readonly comptabiliserUseCase: ComptabiliserDotationUseCase,
    private readonly cederUseCase: CederImmobilisationUseCase,
    private readonly deleteUseCase: DeleteImmobilisationUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: 'Créer une immobilisation et générer le tableau d\'amortissement' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateImmobilisationDto, @CurrentUser() userId: number) {
    return this.createUseCase.execute(
      { ...dto, dateAcquisition: new Date(dto.dateAcquisition) },
      userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lister les immobilisations' })
  findAll(@CurrentUser() userId: number) {
    return this.findUseCase.execute(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une immobilisation avec son tableau d\'amortissement' })
  getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.getUseCase.execute(id, userId);
  }

  @Post(':id/dotation')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: 'Comptabiliser la dotation annuelle d\'une immobilisation' })
  comptabiliserDotation(
    @Param('id', ParseIntPipe) id: number,
    @Query('exercice') exercice: string,
    @CurrentUser() userId: number,
  ) {
    return this.comptabiliserUseCase.execute(id, Number(exercice), userId);
  }

  @Post(':id/cession')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE)
  @ApiOperation({ summary: 'Enregistrer la cession d\'une immobilisation' })
  ceder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CederImmobilisationDto,
    @CurrentUser() userId: number,
  ) {
    return this.cederUseCase.execute(id, new Date(dto.dateCession), dto.prixCession, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE)
  @ApiOperation({ summary: 'Supprimer une immobilisation (sans dotations comptabilisées)' })
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.deleteUseCase.execute(id, userId);
  }
}
