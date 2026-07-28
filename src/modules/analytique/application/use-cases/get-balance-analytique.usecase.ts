import { Inject, Injectable } from '@nestjs/common';
import { ANALYTIQUE_REPOSITORY } from '../ports/analytique.repository.token';
import type { AnalytiqueRepository } from '../ports/analytique.repository.interface';
import type { BalanceCentre } from '../../domain/entities/centre-analytique.entity';

@Injectable()
export class GetBalanceAnalytiqueUseCase {
  constructor(@Inject(ANALYTIQUE_REPOSITORY) private readonly repo: AnalytiqueRepository) {}

  execute(userId: number, dateFrom?: Date, dateTo?: Date): Promise<BalanceCentre[]> {
    return this.repo.getBalance(userId, dateFrom, dateTo);
  }
}
