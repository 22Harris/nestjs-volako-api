import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { FindEvenementsUseCase } from '../application/use-cases/find-evenements.usecase';
import { GetEvenementUseCase } from '../application/use-cases/get-evenement.usecase';
import { CreateEvenementUseCase } from '../application/use-cases/create-evenement.usecase';
import { UpdateEvenementUseCase } from '../application/use-cases/update-evenement.usecase';
import { DeleteEvenementUseCase } from '../application/use-cases/delete-evenement.usecase';
import { MarquerPayeUseCase } from '../application/use-cases/marquer-paye.usecase';
import { CreateEvenementDto } from './dtos/create-evenement.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

const WRITERS = [Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.ASSISTANT];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evenements')
export class EvenementsController {
  constructor(
    private readonly findEvenementsUseCase: FindEvenementsUseCase,
    private readonly getEvenementUseCase: GetEvenementUseCase,
    private readonly createEvenementUseCase: CreateEvenementUseCase,
    private readonly updateEvenementUseCase: UpdateEvenementUseCase,
    private readonly deleteEvenementUseCase: DeleteEvenementUseCase,
    private readonly marquerPayeUseCase: MarquerPayeUseCase,
  ) {}

  @Get()      findAll(@CurrentUser() userId: number) { return this.findEvenementsUseCase.execute(userId); }
  @Get(':id') getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) { return this.getEvenementUseCase.execute(id, userId); }

  @Post()    @Roles(...WRITERS)
  create(@Body() dto: CreateEvenementDto, @CurrentUser() userId: number) { return this.createEvenementUseCase.execute(dto, userId); }

  @Patch(':id') @Roles(...WRITERS)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateEvenementDto>, @CurrentUser() userId: number) {
    return this.updateEvenementUseCase.execute(id, dto as any, userId);
  }

  @Delete(':id') @HttpCode(204) @Roles(...WRITERS)
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) { return this.deleteEvenementUseCase.execute(id, userId); }

  @Patch(':id/payer') @Roles(...WRITERS)
  payer(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) { return this.marquerPayeUseCase.execute(id, userId); }
}
