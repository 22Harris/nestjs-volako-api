import { Injectable, Inject } from '@nestjs/common';
import { RAPPROCHEMENT_REPOSITORY } from '../ports/rapprochement.repository.token';
import type { RapprochementRepository } from '../ports/rapprochement.repository.interface';

@Injectable()
export class GetRelevesUseCase {
  constructor(
    @Inject(RAPPROCHEMENT_REPOSITORY)
    private readonly repo: RapprochementRepository,
  ) {}

  execute(userId: number) {
    return this.repo.findReleves(userId);
  }
}
