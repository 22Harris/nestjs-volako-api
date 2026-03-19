import { ReleveImport } from '../../domain/entities/releve-import.entity';
import { LigneReleve } from '../../domain/entities/ligne-releve.entity';

export interface ParsedLigne {
  date: Date;
  libelle: string;
  montant: number; // centimes
  reference?: string;
}

export interface ImportReleveData {
  nom: string;
  dateDebut?: Date;
  dateFin?: Date;
  soldeDebut?: number;
  soldeFin?: number;
  lignes: ParsedLigne[];
}

export interface RapprochementRepository {
  createReleve(data: ImportReleveData, userId: number): Promise<ReleveImport & { lignes: LigneReleve[] }>;
  findReleves(userId: number): Promise<(ReleveImport & { lignes: LigneReleve[] })[]>;
  findReleve(id: number, userId: number): Promise<(ReleveImport & { lignes: LigneReleve[] }) | null>;
  deleteReleve(id: number, userId: number): Promise<void>;
  rapprocherLigne(ligneId: number, journalLineId: number): Promise<LigneReleve>;
  derapprocherLigne(ligneId: number): Promise<LigneReleve>;
  findLigneReleve(ligneId: number): Promise<LigneReleve | null>;
}
