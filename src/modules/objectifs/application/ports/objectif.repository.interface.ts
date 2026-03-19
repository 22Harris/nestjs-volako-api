import { Objectif } from '../../domain/entities/objectif.entity';
export interface ObjectifRepository {
  findAll(userId: number): Promise<Objectif[]>;
  findById(id: number, userId: number): Promise<Objectif | null>;
  create(data: any, userId: number): Promise<Objectif>;
  update(id: number, data: any, userId: number): Promise<Objectif>;
  delete(id: number, userId: number): Promise<void>;
  versement(id: number, montant: number, userId: number): Promise<Objectif>;
}
