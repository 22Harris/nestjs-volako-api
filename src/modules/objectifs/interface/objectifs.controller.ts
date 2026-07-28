import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { FindObjectifsUseCase } from '../application/use-cases/find-objectifs.usecase';
import { GetObjectifUseCase } from '../application/use-cases/get-objectif.usecase';
import { CreateObjectifUseCase } from '../application/use-cases/create-objectif.usecase';
import { UpdateObjectifUseCase } from '../application/use-cases/update-objectif.usecase';
import { DeleteObjectifUseCase } from '../application/use-cases/delete-objectif.usecase';
import { VersementUseCase } from '../application/use-cases/versement.usecase';
import { CreateObjectifDto } from './dtos/create-objectif.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

const WRITERS = [Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('objectifs')
export class ObjectifsController {
  constructor(
    private readonly findObjectifsUseCase: FindObjectifsUseCase,
    private readonly getObjectifUseCase: GetObjectifUseCase,
    private readonly createObjectifUseCase: CreateObjectifUseCase,
    private readonly updateObjectifUseCase: UpdateObjectifUseCase,
    private readonly deleteObjectifUseCase: DeleteObjectifUseCase,
    private readonly versementUseCase: VersementUseCase,
  ) {}

  @Get()      findAll(@CurrentUser() userId: number) { return this.findObjectifsUseCase.execute(userId); }
  @Get(':id') getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) { return this.getObjectifUseCase.execute(id, userId); }

  @Post()    @Roles(...WRITERS)
  create(@Body() dto: CreateObjectifDto, @CurrentUser() userId: number) { return this.createObjectifUseCase.execute(dto, userId); }

  @Patch(':id') @Roles(...WRITERS)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateObjectifDto>, @CurrentUser() userId: number) {
    return this.updateObjectifUseCase.execute(id, dto, userId);
  }

  @Delete(':id') @HttpCode(204) @Roles(...WRITERS)
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) { return this.deleteObjectifUseCase.execute(id, userId); }

  @Patch(':id/versement') @Roles(...WRITERS)
  versement(@Param('id', ParseIntPipe) id: number, @Body('montant') montant: number, @CurrentUser() userId: number) {
    return this.versementUseCase.execute(id, montant, userId);
  }
}
