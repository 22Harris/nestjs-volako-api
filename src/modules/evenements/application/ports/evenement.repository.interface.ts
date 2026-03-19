import { Evenement } from '../../domain/entities/evenement.entity';

export interface EvenementRepository {
  findAll(userId: number): Promise<Evenement[]>;
  findById(id: number, userId: number): Promise<Evenement | null>;
  create(data: Partial<Evenement>, userId: number): Promise<Evenement>;
  update(id: number, data: Partial<Evenement>, userId: number): Promise<Evenement>;
  delete(id: number, userId: number): Promise<void>;
  marquerPaye(id: number, userId: number): Promise<{ updated: Evenement; next: Evenement | null }>;
}
