import { Objectif } from '../../domain/entities/objectif.entity';
export interface ObjectifRepository {
  findAll(): Promise<Objectif[]>;
  findById(id: number): Promise<Objectif | null>;
  create(data: any): Promise<Objectif>;
  update(id: number, data: any): Promise<Objectif>;
  delete(id: number): Promise<void>;
  versement(id: number, montant: number): Promise<Objectif>;
}
