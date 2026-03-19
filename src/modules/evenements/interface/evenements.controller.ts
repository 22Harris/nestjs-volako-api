import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { FindEvenementsUseCase } from '../application/use-cases/find-evenements.usecase';
import { GetEvenementUseCase } from '../application/use-cases/get-evenement.usecase';
import { CreateEvenementUseCase } from '../application/use-cases/create-evenement.usecase';
import { UpdateEvenementUseCase } from '../application/use-cases/update-evenement.usecase';
import { DeleteEvenementUseCase } from '../application/use-cases/delete-evenement.usecase';
import { MarquerPayeUseCase } from '../application/use-cases/marquer-paye.usecase';
import { CreateEvenementDto } from './dtos/create-evenement.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
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

  @Get()     findAll(@CurrentUser() userId: number)                               { return this.findEvenementsUseCase.execute(userId); }
  @Get(':id') getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) { return this.getEvenementUseCase.execute(id, userId); }
  @Post()    create(@Body() dto: CreateEvenementDto, @CurrentUser() userId: number)         { return this.createEvenementUseCase.execute(dto, userId); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateEvenementDto>, @CurrentUser() userId: number) {
    return this.updateEvenementUseCase.execute(id, dto as any, userId);
  }
  @Delete(':id') @HttpCode(204)
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number)             { return this.deleteEvenementUseCase.execute(id, userId); }

  @Patch(':id/payer') payer(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) { return this.marquerPayeUseCase.execute(id, userId); }
}
