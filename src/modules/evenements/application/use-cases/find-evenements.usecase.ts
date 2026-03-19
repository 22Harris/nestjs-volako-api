import { Inject, Injectable } from '@nestjs/common';
import { EVENEMENT_REPOSITORY } from '../ports/evenement.repository.token';
import type { EvenementRepository } from '../ports/evenement.repository.interface';
import { Evenement } from '../../domain/entities/evenement.entity';
@Injectable()
export class FindEvenementsUseCase {
  constructor(@Inject(EVENEMENT_REPOSITORY) private readonly repo: EvenementRepository) {}
  execute(userId: number): Promise<Evenement[]> { return this.repo.findAll(userId); }
}
