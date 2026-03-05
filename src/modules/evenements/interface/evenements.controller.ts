import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { FindEvenementsUseCase } from '../application/use-cases/find-evenements.usecase';
import { GetEvenementUseCase } from '../application/use-cases/get-evenement.usecase';
import { CreateEvenementUseCase } from '../application/use-cases/create-evenement.usecase';
import { UpdateEvenementUseCase } from '../application/use-cases/update-evenement.usecase';
import { DeleteEvenementUseCase } from '../application/use-cases/delete-evenement.usecase';
import { MarquerPayeUseCase } from '../application/use-cases/marquer-paye.usecase';
import { CreateEvenementDto } from './dtos/create-evenement.dto';

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

  @Get()     findAll()                               { return this.findEvenementsUseCase.execute(); }
  @Get(':id') getById(@Param('id', ParseIntPipe) id: number) { return this.getEvenementUseCase.execute(id); }
  @Post()    create(@Body() dto: CreateEvenementDto)         { return this.createEvenementUseCase.execute(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateEvenementDto>) {
    return this.updateEvenementUseCase.execute(id, dto as any);
  }
  @Delete(':id') @HttpCode(204)
  delete(@Param('id', ParseIntPipe) id: number)             { return this.deleteEvenementUseCase.execute(id); }

  @Patch(':id/payer') payer(@Param('id', ParseIntPipe) id: number) { return this.marquerPayeUseCase.execute(id); }
}
