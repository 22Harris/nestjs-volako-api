import { Inject, Injectable } from '@nestjs/common';
import type { FiscalYearRepository } from '../ports/fiscal-year.repository.interface';
import { FISCAL_YEAR_REPOSITORY } from '../ports/fiscal-year.token';
import { FiscalYear } from '../../domain/entities/fiscal-year.entity';

@Injectable()
export class FindFiscalYearsUseCase {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly repo: FiscalYearRepository,
  ) {}

  execute(userId: number): Promise<FiscalYear[]> {
    return this.repo.findAll(userId);
  }
}
