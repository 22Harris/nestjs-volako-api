import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RECURRENTES } from '../ports/recurrentes.token';
import type { RecurrentesRepository } from '../ports/recurrentes.repository.interface';
import { CreateJournalEntryUseCase } from '../../../journal-entries/application/use-cases/create-journal-entry.usecase';
import { EcritureRecurrente } from '../../domain/entities/ecriture-recurrente.entity';

export interface ExecutionResult {
  executed: number;
  errors: Array<{ id: number; label: string; error: string }>;
}

@Injectable()
export class ExecuterRecurrentesUseCase {
  private readonly logger = new Logger(ExecuterRecurrentesUseCase.name);

  constructor(
    @Inject(RECURRENTES)
    private readonly repo: RecurrentesRepository,
    private readonly createEntry: CreateJournalEntryUseCase,
  ) {}

  @Cron('0 6 * * *')
  async runScheduled(): Promise<void> {
    const result = await this.execute();
    this.logger.log(`Écritures récurrentes : ${result.executed} exécutées, ${result.errors.length} erreurs.`);
  }

  async execute(): Promise<ExecutionResult> {
    const dues = await this.repo.findDues();
    let executed = 0;
    const errors: ExecutionResult['errors'] = [];

    for (const ecriture of dues) {
      const outcome = await this.executeOne(ecriture);
      if (outcome === null) {
        executed++;
      } else {
        errors.push({ id: ecriture.id!, label: ecriture.label, error: outcome });
      }
    }

    return { executed, errors };
  }

  private async executeOne(ecriture: EcritureRecurrente): Promise<string | null> {
    try {
      await this.createEntry.execute(
        {
          date:      ecriture.prochainExecution.toISOString().slice(0, 10),
          label:     ecriture.label,
          journalId: ecriture.journalId,
          lines:     ecriture.lignes.map(l => ({
            accountId: l.accountId,
            debit:     l.debit,
            credit:    l.credit,
            codeTva:   l.codeTva,
          })),
        },
        undefined,
        ecriture.userId!,
      );
      const next = EcritureRecurrente.nextExecution(ecriture.frequence, ecriture.prochainExecution);
      await this.repo.updateNextExecution(ecriture.id!, next);
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : String(e);
    }
  }
}
