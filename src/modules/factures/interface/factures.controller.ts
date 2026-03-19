import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FindFacturesUseCase } from '../application/use-cases/find-factures.usecase';
import { GetFactureUseCase } from '../application/use-cases/get-facture.usecase';
import { CreateFactureUseCase } from '../application/use-cases/create-facture.usecase';
import { UpdateFactureUseCase } from '../application/use-cases/update-facture.usecase';
import { DeleteFactureUseCase } from '../application/use-cases/delete-facture.usecase';
import { AddPaiementUseCase } from '../application/use-cases/add-paiement.usecase';
import { LettrerUseCase } from '../application/use-cases/lettrer.usecase';
import { CreateFactureDto } from './dtos/create-facture.dto';
import { UpdateFactureDto } from './dtos/update-facture.dto';
import { AddPaiementDto } from './dtos/add-paiement.dto';

@UseGuards(JwtAuthGuard)
@Controller('factures')
export class FacturesController {
  constructor(
    private readonly findAll: FindFacturesUseCase,
    private readonly getOne: GetFactureUseCase,
    private readonly create: CreateFactureUseCase,
    private readonly update: UpdateFactureUseCase,
    private readonly remove: DeleteFactureUseCase,
    private readonly addPaiement: AddPaiementUseCase,
    private readonly lettrer: LettrerUseCase,
  ) {}

  @Get()
  getAll(@CurrentUser() userId: number, @Query('tiersId') tiersId?: string) {
    return this.findAll.execute(userId, tiersId ? parseInt(tiersId, 10) : undefined);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.getOne.execute(id, userId);
  }

  @Post()
  createFacture(@Body() dto: CreateFactureDto, @CurrentUser() userId: number) {
    return this.create.execute(
      {
        ...dto,
        date: new Date(dto.date),
        dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : undefined,
        statut: dto.statut ?? 'EN_ATTENTE',
      },
      userId,
    );
  }

  @Patch(':id')
  updateFacture(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFactureDto,
    @CurrentUser() userId: number,
  ) {
    const data: Parameters<typeof this.update.execute>[1] = {
      ...(dto.numero !== undefined && { numero: dto.numero }),
      ...(dto.montant !== undefined && { montant: dto.montant }),
      ...(dto.statut !== undefined && { statut: dto.statut }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.tiersId !== undefined && { tiersId: dto.tiersId }),
      ...(dto.date && { date: new Date(dto.date) }),
      ...(dto.dateEcheance && { dateEcheance: new Date(dto.dateEcheance) }),
    };
    return this.update.execute(id, data, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFacture(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.remove.execute(id, userId);
  }

  @Post(':id/paiement')
  enregistrerPaiement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPaiementDto,
    @CurrentUser() userId: number,
  ) {
    return this.addPaiement.execute(id, { ...dto, date: new Date(dto.date) }, userId);
  }

  @Post(':id/lettrer')
  lettrerFacture(
    @Param('id', ParseIntPipe) id: number,
    @Body('lettre') lettre: string,
    @CurrentUser() userId: number,
  ) {
    return this.lettrer.execute(id, lettre, userId);
  }
}
