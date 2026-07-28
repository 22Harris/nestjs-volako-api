import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RECURRENTES } from '../ports/recurrentes.token';
import type { RecurrentesRepository } from '../ports/recurrentes.repository.interface';
import { EcritureRecurrente } from '../../domain/entities/ecriture-recurrente.entity';
import type { Frequence, LigneRecurrenteData } from '../../domain/entities/ecriture-recurrente.entity';
import type { ModifierRecurrenteDto } from '../../interface/dtos/recurrente.dto';

@Injectable()
export class ModifierRecurrenteUseCase {
  constructor(
    @Inject(RECURRENTES)
    private readonly repo: RecurrentesRepository,
  ) {}

  async execute(id: number, dto: ModifierRecurrenteDto, userId: number): Promise<EcritureRecurrente> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundException(`Écriture récurrente #${id} introuvable.`);

    if (dto.lignes) {
      const totalDebit  = dto.lignes.reduce((s, l) => s + l.debit, 0);
      const totalCredit = dto.lignes.reduce((s, l) => s + l.credit, 0);
      if (totalDebit !== totalCredit) {
        throw new BadRequestException(
          `L'écriture modèle est déséquilibrée (débit ${totalDebit} ≠ crédit ${totalCredit}).`,
        );
      }
    }

    return this.repo.update(
      id,
      {
        label:             dto.label,
        frequence:         dto.frequence as Frequence | undefined,
        prochainExecution: dto.prochainExecution ? new Date(dto.prochainExecution) : undefined,
        actif:             dto.actif,
        journalId:         dto.journalId,
        lignes:            dto.lignes as LigneRecurrenteData[] | undefined,
      },
      userId,
    );
  }
}
