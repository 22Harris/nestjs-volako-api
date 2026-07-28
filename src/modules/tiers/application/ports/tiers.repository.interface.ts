import { Tiers } from '../../domain/entities/tiers.entity';
import { PaginatedResult } from '../../../../common/dto/paginated.js';

export interface TiersSolde {
  tiersId: number;
  nom: string;
  type: string;
  montantFacture: number;
  montantPaye: number;
  solde: number;
}

export interface TiersRepository {
  findAll(userId: number, page?: number, pageSize?: number): Promise<PaginatedResult<Tiers>>;
  findById(id: number, userId: number): Promise<Tiers | null>;
  search(term: string, userId: number): Promise<Tiers[]>;
  create(data: Partial<Tiers>, userId: number): Promise<Tiers>;
  update(id: number, data: Partial<Tiers>, userId: number): Promise<Tiers>;
  delete(id: number, userId: number): Promise<void>;
  getSoldes(userId: number): Promise<TiersSolde[]>;
  getSolde(id: number, userId: number): Promise<TiersSolde>;
}
