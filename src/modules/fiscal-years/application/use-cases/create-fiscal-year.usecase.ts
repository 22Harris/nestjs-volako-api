import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { FiscalYearRepository } from '../ports/fiscal-year.repository.interface';
import { FISCAL_YEAR_REPOSITORY } from '../ports/fiscal-year.token';
import { FiscalYear } from '../../domain/entities/fiscal-year.entity';

@Injectable()
export class CreateFiscalYearUseCase {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly repo: FiscalYearRepository,
  ) {}

  async execute(annee: number, userId: number): Promise<FiscalYear> {
    const existing = await this.repo.findByAnnee(annee, userId);
    if (existing) throw new ConflictException(`L'exercice ${annee} existe déjà`);
    return this.repo.create(annee, userId);
  }
}
