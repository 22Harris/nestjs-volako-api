import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { FindObjectifsUseCase } from '../application/use-cases/find-objectifs.usecase';
import { GetObjectifUseCase } from '../application/use-cases/get-objectif.usecase';
import { CreateObjectifUseCase } from '../application/use-cases/create-objectif.usecase';
import { UpdateObjectifUseCase } from '../application/use-cases/update-objectif.usecase';
import { DeleteObjectifUseCase } from '../application/use-cases/delete-objectif.usecase';
import { VersementUseCase } from '../application/use-cases/versement.usecase';
import { CreateObjectifDto } from './dtos/create-objectif.dto';

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

  @Get()     findAll()                                      { return this.findObjectifsUseCase.execute(); }
  @Get(':id') getById(@Param('id', ParseIntPipe) id: number){ return this.getObjectifUseCase.execute(id); }
  @Post()    create(@Body() dto: CreateObjectifDto)         { return this.createObjectifUseCase.execute(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateObjectifDto>) {
    return this.updateObjectifUseCase.execute(id, dto);
  }
  @Delete(':id') @HttpCode(204) delete(@Param('id', ParseIntPipe) id: number) { return this.deleteObjectifUseCase.execute(id); }
  @Patch(':id/versement') versement(@Param('id', ParseIntPipe) id: number, @Body('montant') montant: number) {
    return this.versementUseCase.execute(id, montant);
  }
}
