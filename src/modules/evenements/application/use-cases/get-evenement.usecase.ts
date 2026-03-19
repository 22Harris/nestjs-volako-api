import { Inject, Injectable } from '@nestjs/common';
import { EVENEMENT_REPOSITORY } from '../ports/evenement.repository.token';
import type { EvenementRepository } from '../ports/evenement.repository.interface';
import { Evenement } from '../../domain/entities/evenement.entity';
@Injectable()
export class GetEvenementUseCase {
  constructor(@Inject(EVENEMENT_REPOSITORY) private readonly repo: EvenementRepository) {}
  execute(id: number, userId: number): Promise<Evenement | null> { return this.repo.findById(id, userId); }
}
