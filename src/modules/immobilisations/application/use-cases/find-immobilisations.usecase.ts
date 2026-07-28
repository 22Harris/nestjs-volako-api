import { Inject, Injectable } from '@nestjs/common';
import { IMMOBILISATIONS_REPOSITORY } from '../ports/immobilisations.repository.token';
import type { ImmobilisationsRepository } from '../ports/immobilisations.repository.interface';
import { Immobilisation } from '../../domain/entities/immobilisation.entity';

@Injectable()
export class FindImmobilisationsUseCase {
  constructor(
    @Inject(IMMOBILISATIONS_REPOSITORY)
    private readonly repo: ImmobilisationsRepository,
  ) {}

  execute(userId: number): Promise<Immobilisation[]> {
    return this.repo.findAll(userId);
  }
}
