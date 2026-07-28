import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IMMOBILISATIONS_REPOSITORY } from '../ports/immobilisations.repository.token';
import type { ImmobilisationsRepository } from '../ports/immobilisations.repository.interface';
import { Immobilisation } from '../../domain/entities/immobilisation.entity';

@Injectable()
export class GetImmobilisationUseCase {
  constructor(
    @Inject(IMMOBILISATIONS_REPOSITORY)
    private readonly repo: ImmobilisationsRepository,
  ) {}

  async execute(id: number, userId: number): Promise<Immobilisation> {
    const immo = await this.repo.findById(id, userId);
    if (!immo) throw new NotFoundException('Immobilisation introuvable');
    return immo;
  }
}
