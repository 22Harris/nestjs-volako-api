import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FindJournalsUseCase } from '../application/use-cases/find-journals.usecase';
import { GetOrCreateJournalUseCase } from '../application/use-cases/get-or-create-journal.usecase';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IsEnum } from 'class-validator';
import { JournalType } from '@prisma/client';
import { Journal } from '../domain/entities/journal.entity';

class CreateJournalDto {
  @IsEnum(JournalType)
  type: JournalType;
}

@UseGuards(JwtAuthGuard)
@Controller('journals')
export class JournalsController {
  constructor(
    private readonly findJournals: FindJournalsUseCase,
    private readonly getOrCreate: GetOrCreateJournalUseCase,
  ) {}

  @Get()
  getAll(@CurrentUser() userId: number): Promise<Journal[]> {
    return this.findJournals.execute(userId);
  }

  @Post()
  create(@Body() dto: CreateJournalDto, @CurrentUser() userId: number): Promise<Journal> {
    return this.getOrCreate.execute(dto.type, userId);
  }
}
