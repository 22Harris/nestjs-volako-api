import type { CompteBank } from '../../domain/entities/compte-bank.entity';

export interface CreateCompteBankData {
  nom: string;
  iban: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface CompteBankRepository {
  create(data: CreateCompteBankData, userId: number): Promise<CompteBank>;
  findAll(userId: number): Promise<CompteBank[]>;
  findById(id: number, userId: number): Promise<CompteBank | null>;
  updateTokens(id: number, accessToken: string, refreshToken?: string, tokenExpiresAt?: Date): Promise<void>;
  updateDerniereSync(id: number, date: Date): Promise<void>;
  delete(id: number, userId: number): Promise<void>;
}

export const COMPTE_BANK_REPOSITORY = 'COMPTE_BANK_REPOSITORY';
