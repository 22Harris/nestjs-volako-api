import { Facture } from '../../domain/entities/facture.entity';
import { Paiement } from '../../domain/entities/paiement.entity';

export interface FactureRepository {
  findAll(userId: number, tiersId?: number): Promise<Facture[]>;
  findById(id: number, userId: number): Promise<Facture | null>;
  create(data: Partial<Facture>, userId: number): Promise<Facture>;
  update(id: number, data: Partial<Facture>, userId: number): Promise<Facture>;
  delete(id: number, userId: number): Promise<void>;
  addPaiement(factureId: number, data: Partial<Paiement>, userId: number): Promise<Facture>;
  lettrer(factureId: number, lettre: string, userId: number): Promise<void>;
}
