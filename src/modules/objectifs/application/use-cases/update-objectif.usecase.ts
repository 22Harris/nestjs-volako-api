import { Inject, Injectable } from '@nestjs/common';
import { OBJECTIF_REPOSITORY } from '../ports/objectif.repository.token';
import type { ObjectifRepository } from '../ports/objectif.repository.interface';
import { Objectif } from '../../domain/entities/objectif.entity';
@Injectable()
export class UpdateObjectifUseCase {
  constructor(@Inject(OBJECTIF_REPOSITORY) private readonly repo: ObjectifRepository) {}
  execute(id: number, data: any): Promise<Objectif> { return this.repo.update(id, data); }
}
