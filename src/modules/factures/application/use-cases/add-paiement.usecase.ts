import { Injectable, Inject } from '@nestjs/common';
import { FACTURE_REPOSITORY } from '../ports/facture.repository.token';
import type { FactureRepository } from '../ports/facture.repository.interface';
import { Facture } from '../../domain/entities/facture.entity';
import { Paiement } from '../../domain/entities/paiement.entity';

@Injectable()
export class AddPaiementUseCase {
  constructor(@Inject(FACTURE_REPOSITORY) private readonly repo: FactureRepository) {}

  execute(factureId: number, data: Partial<Paiement>, userId: number): Promise<Facture> {
    return this.repo.addPaiement(factureId, data, userId);
  }
}
