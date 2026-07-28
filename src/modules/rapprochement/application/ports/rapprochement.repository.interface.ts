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

export interface JournalLineCandidate {
  id: number;
  debit: number;
  credit: number;
  account: { id: number; code: string; name: string };
  entry: { id: number; date: Date; label: string; pieceNumber: string | null };
}

export interface RapprochementRepository {
  createReleve(data: ImportReleveData, userId: number): Promise<ReleveImport & { lignes: LigneReleve[] }>;
  findReleves(userId: number): Promise<(ReleveImport & { lignes: LigneReleve[] })[]>;
  findReleve(id: number, userId: number): Promise<(ReleveImport & { lignes: LigneReleve[] }) | null>;
  deleteReleve(id: number, userId: number): Promise<void>;
  rapprocherLigne(ligneId: number, journalLineId: number): Promise<LigneReleve>;
  derapprocherLigne(ligneId: number): Promise<LigneReleve>;
  findLigneReleve(ligneId: number): Promise<LigneReleve | null>;
  findLigneReleveForUser(ligneId: number, userId: number): Promise<LigneReleve | null>;
  findPendingLignesForReleve(releveId: number, userId: number): Promise<LigneReleve[]>;
  findJournalLinesForMatching(
    userId: number,
    montantAbs: number,
    date: Date,
    toleranceJours: number,
    tolerancePct: number,
  ): Promise<JournalLineCandidate[]>;
}
