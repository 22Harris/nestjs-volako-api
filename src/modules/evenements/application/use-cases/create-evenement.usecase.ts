import { Inject, Injectable } from '@nestjs/common';
import { EVENEMENT_REPOSITORY } from '../ports/evenement.repository.token';
import type { EvenementRepository } from '../ports/evenement.repository.interface';
import { Evenement } from '../../domain/entities/evenement.entity';
import { CreateEvenementDto } from '../../interface/dtos/create-evenement.dto';
@Injectable()
export class CreateEvenementUseCase {
  constructor(@Inject(EVENEMENT_REPOSITORY) private readonly repo: EvenementRepository) {}
  execute(dto: CreateEvenementDto): Promise<Evenement> { return this.repo.create(dto as any); }
}
