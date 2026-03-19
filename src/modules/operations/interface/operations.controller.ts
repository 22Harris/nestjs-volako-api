import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateOperationUseCase } from '../application/use-cases/create_operation.usecase';
import { FindOperationsUseCase } from '../application/use-cases/find_operations.usecase';
import { GetOperationUseCase } from '../application/use-cases/get_operation.usecase';
import { UpdateOperationUseCase } from '../application/use-cases/update_operation.usecase';
import { DeleteOperationUseCase } from '../application/use-cases/delete_operation.usecase';
import { CreateOperationDto } from './dtos/create-operation.dto';
import { Operation } from '../domain/operation.entity';
import { OperationType } from './types/operation.type';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('operations')
export class OperationsController {
  constructor(
    private readonly createOperationUseCase: CreateOperationUseCase,
    private readonly findOperationsUseCase: FindOperationsUseCase,
    private readonly getOperationUseCase: GetOperationUseCase,
    private readonly updateOperationUseCase: UpdateOperationUseCase,
    private readonly deleteOperationUseCase: DeleteOperationUseCase,
  ) {}

  @Post()
  createOperation(@Body() dto: CreateOperationDto, @CurrentUser() userId: number): Promise<Operation> {
    return this.createOperationUseCase.execute(dto, userId);
  }

  @Get()
  findOperations(
    @CurrentUser() userId: number,
    @Query('type') type?: OperationType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<Operation[]> {
    return this.findOperationsUseCase.execute(userId, { type, dateFrom, dateTo });
  }

  @Get(':id')
  getOperation(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<Operation | null> {
    return this.getOperationUseCase.execute(id, userId);
  }

  @Patch(':id')
  updateOperation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateOperationDto>,
    @CurrentUser() userId: number,
  ): Promise<Operation> {
    return this.updateOperationUseCase.execute(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteOperation(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<void> {
    return this.deleteOperationUseCase.execute(id, userId);
  }
}
