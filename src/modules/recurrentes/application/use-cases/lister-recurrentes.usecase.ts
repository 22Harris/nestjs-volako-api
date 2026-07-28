import { Inject, Injectable } from '@nestjs/common';
import { RECURRENTES } from '../ports/recurrentes.token';
import type { RecurrentesRepository } from '../ports/recurrentes.repository.interface';
import { EcritureRecurrente } from '../../domain/entities/ecriture-recurrente.entity';

@Injectable()
export class ListerRecurrentesUseCase {
  constructor(
    @Inject(RECURRENTES)
    private readonly repo: RecurrentesRepository,
  ) {}

  execute(userId: number): Promise<EcritureRecurrente[]> {
    return this.repo.findAll(userId);
  }
}
