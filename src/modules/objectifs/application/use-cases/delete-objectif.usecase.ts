import { Inject, Injectable } from '@nestjs/common';
import { OBJECTIF_REPOSITORY } from '../ports/objectif.repository.token';
import type { ObjectifRepository } from '../ports/objectif.repository.interface';
@Injectable()
export class DeleteObjectifUseCase {
  constructor(@Inject(OBJECTIF_REPOSITORY) private readonly repo: ObjectifRepository) {}
  execute(id: number, userId: number): Promise<void> { return this.repo.delete(id, userId); }
}
