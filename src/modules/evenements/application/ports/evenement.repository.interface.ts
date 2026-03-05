import { Evenement } from '../../domain/entities/evenement.entity';

export interface EvenementRepository {
  findAll(): Promise<Evenement[]>;
  findById(id: number): Promise<Evenement | null>;
  create(data: Partial<Evenement>): Promise<Evenement>;
  update(id: number, data: Partial<Evenement>): Promise<Evenement>;
  delete(id: number): Promise<void>;
  marquerPaye(id: number): Promise<{ updated: Evenement; next: Evenement | null }>;
}
