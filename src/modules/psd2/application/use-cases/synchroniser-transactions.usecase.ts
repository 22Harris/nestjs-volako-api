import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { COMPTE_BANK_REPOSITORY } from '../ports/compte-bank.repository.interface';
import type { CompteBankRepository } from '../ports/compte-bank.repository.interface';
import { PSD2_PROVIDER } from '../ports/psd2-provider.interface';
import type { Psd2Provider } from '../ports/psd2-provider.interface';
import { RAPPROCHEMENT_REPOSITORY } from '../../../rapprochement/application/ports/rapprochement.repository.token';
import type { RapprochementRepository } from '../../../rapprochement/application/ports/rapprochement.repository.interface';

export interface SyncResult {
  compteBankId: number;
  releveId: number;
  transactions: number;
}

@Injectable()
export class SynchroniserTransactionsUseCase {
  private readonly logger = new Logger(SynchroniserTransactionsUseCase.name);

  constructor(
    @Inject(COMPTE_BANK_REPOSITORY)
    private readonly compteBankRepo: CompteBankRepository,
    @Inject(PSD2_PROVIDER)
    private readonly provider: Psd2Provider,
    @Inject(RAPPROCHEMENT_REPOSITORY)
    private readonly rapprochementRepo: RapprochementRepository,
  ) {}

  async execute(compteBankId: number, userId: number, dateTo?: Date): Promise<SyncResult> {
    const compte = await this.compteBankRepo.findById(compteBankId, userId);
    if (!compte) throw new NotFoundException(`Compte bancaire #${compteBankId} introuvable.`);

    const accessToken = await this.resolveToken(compte, compteBankId);
    const dateFrom = compte.derniereSync ?? new Date(Date.now() - 90 * 86_400_000);
    const dateFin  = dateTo ?? new Date();

    const transactions = await this.provider.getTransactions(accessToken, compte.iban, dateFrom, dateFin);

    if (transactions.length === 0) {
      await this.compteBankRepo.updateDerniereSync(compteBankId, dateFin);
      return { compteBankId, releveId: 0, transactions: 0 };
    }

    const dates  = transactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
    const releve = await this.rapprochementRepo.createReleve(
      {
        nom:       `PSD2 – ${compte.nom} – ${dateFin.toISOString().slice(0, 10)}`,
        dateDebut: dates[0],
        dateFin:   dates.at(-1)!,
        lignes:    transactions.map(t => ({
          date:      t.date,
          libelle:   t.libelle,
          montant:   t.montant,
          reference: t.reference,
        })),
      },
      userId,
    );

    await this.compteBankRepo.updateDerniereSync(compteBankId, dateFin);
    this.logger.log(`PSD2 sync compte #${compteBankId}: ${transactions.length} transactions importées.`);
    return { compteBankId, releveId: releve.id ?? 0, transactions: transactions.length };
  }

  private async resolveToken(compte: InstanceType<typeof import('../../domain/entities/compte-bank.entity').CompteBank>, id: number): Promise<string> {
    if (!compte.tokenExpired) return compte.accessToken;
    if (!compte.refreshToken) {
      throw new Error(`Token expiré pour le compte #${id} et pas de refresh token disponible.`);
    }
    const tokens = await this.provider.refreshAccessToken(compte.refreshToken);
    await this.compteBankRepo.updateTokens(id, tokens.accessToken, tokens.refreshToken, tokens.expiresAt);
    return tokens.accessToken;
  }
}
