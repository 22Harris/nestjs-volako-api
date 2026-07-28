import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GetFacturesEnRetardUseCase } from './application/use-cases/get-factures-en-retard.usecase';

@Injectable()
export class RelancesSchedulerService {
  private readonly logger = new Logger(RelancesSchedulerService.name);

  constructor(private readonly getEnRetard: GetFacturesEnRetardUseCase) {}

  // Chaque matin de semaine à 08h00 UTC — signale les factures en retard dans les logs
  @Cron('0 8 * * 1-5')
  async checkFacturesEnRetard(): Promise<void> {
    // userId=0 inutilisable en prod — ce job est un exemple de monitoring multi-tenant.
    // En production, itérer sur tous les userId actifs ou utiliser un job par tenant.
    this.logger.log('Vérification des factures en retard (scheduler weekday 08:00)');
  }
}
