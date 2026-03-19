import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FindTiersUseCase } from '../application/use-cases/find-tiers.usecase';
import { GetTiersUseCase } from '../application/use-cases/get-tiers.usecase';
import { CreateTiersUseCase } from '../application/use-cases/create-tiers.usecase';
import { UpdateTiersUseCase } from '../application/use-cases/update-tiers.usecase';
import { DeleteTiersUseCase } from '../application/use-cases/delete-tiers.usecase';
import { GetSoldesUseCase } from '../application/use-cases/get-soldes.usecase';
import { SearchTiersUseCase } from '../application/use-cases/search-tiers.usecase';
import { CreateTiersDto } from './dtos/create-tiers.dto';
import { UpdateTiersDto } from './dtos/update-tiers.dto';

@UseGuards(JwtAuthGuard)
@Controller('tiers')
export class TiersController {
  constructor(
    private readonly findAll: FindTiersUseCase,
    private readonly getOne: GetTiersUseCase,
    private readonly create: CreateTiersUseCase,
    private readonly update: UpdateTiersUseCase,
    private readonly remove: DeleteTiersUseCase,
    private readonly getSoldes: GetSoldesUseCase,
    private readonly search: SearchTiersUseCase,
  ) {}

  @Get()
  getAll(@CurrentUser() userId: number) {
    return this.findAll.execute(userId);
  }

  @Get('soldes')
  soldes(@CurrentUser() userId: number) {
    return this.getSoldes.execute(userId);
  }

  @Get('search')
  searchTiers(@Query('term') term: string, @CurrentUser() userId: number) {
    return this.search.execute(term ?? '', userId);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.getOne.execute(id, userId);
  }

  @Post()
  createTiers(@Body() dto: CreateTiersDto, @CurrentUser() userId: number) {
    return this.create.execute(dto, userId);
  }

  @Patch(':id')
  updateTiers(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTiersDto,
    @CurrentUser() userId: number,
  ) {
    return this.update.execute(id, dto, userId);
  }

  @Delete(':id')
  deleteTiers(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.remove.execute(id, userId);
  }
}
