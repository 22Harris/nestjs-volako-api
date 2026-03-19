import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { FiscalYearRepository } from '../ports/fiscal-year.repository.interface';
import { FISCAL_YEAR_REPOSITORY } from '../ports/fiscal-year.token';
import { FiscalYear } from '../../domain/entities/fiscal-year.entity';

@Injectable()
export class GetFiscalYearUseCase {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly repo: FiscalYearRepository,
  ) {}

  async execute(id: number, userId: number): Promise<FiscalYear> {
    const fy = await this.repo.findById(id, userId);
    if (!fy) throw new NotFoundException(`Exercice fiscal ${id} introuvable`);
    return fy;
  }
}
