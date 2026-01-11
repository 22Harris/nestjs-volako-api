import { Body, Controller, Post } from '@nestjs/common';
import { CreateOperationUseCase } from '../application/use-cases/create_operation.usecase';
import { CreateOperationDto } from './dtos/create-operation.dto';
import { Operation } from '../domain/operation.entity';

@Controller('operations')
export class OperationsController {
  constructor(
    private readonly createOperationUseCase: CreateOperationUseCase,
  ) {}

  @Post()
  createOperation(
    @Body() createOperationDto: CreateOperationDto,
  ): Promise<Operation> {
    return this.createOperationUseCase.execute(createOperationDto);
  }
}
