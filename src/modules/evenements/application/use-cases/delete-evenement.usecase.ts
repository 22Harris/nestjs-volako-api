import { Inject, Injectable } from '@nestjs/common';
import { EVENEMENT_REPOSITORY } from '../ports/evenement.repository.token';
import type { EvenementRepository } from '../ports/evenement.repository.interface';
@Injectable()
export class DeleteEvenementUseCase {
  constructor(@Inject(EVENEMENT_REPOSITORY) private readonly repo: EvenementRepository) {}
  execute(id: number): Promise<void> { return this.repo.delete(id); }
}
