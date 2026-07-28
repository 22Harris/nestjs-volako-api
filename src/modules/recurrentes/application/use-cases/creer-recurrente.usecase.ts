import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RECURRENTES } from '../ports/recurrentes.token';
import type { RecurrentesRepository } from '../ports/recurrentes.repository.interface';
import { EcritureRecurrente } from '../../domain/entities/ecriture-recurrente.entity';
import type { Frequence, LigneRecurrenteData } from '../../domain/entities/ecriture-recurrente.entity';
import type { CreerRecurrenteDto } from '../../interface/dtos/recurrente.dto';

@Injectable()
export class CreerRecurrenteUseCase {
  constructor(
    @Inject(RECURRENTES)
    private readonly repo: RecurrentesRepository,
  ) {}

  async execute(dto: CreerRecurrenteDto, userId: number): Promise<EcritureRecurrente> {
    this.validateLignes(dto.lignes);
    return this.repo.create(
      {
        label:             dto.label,
        frequence:         dto.frequence as Frequence,
        prochainExecution: new Date(dto.prochainExecution),
        journalId:         dto.journalId,
        lignes:            dto.lignes as LigneRecurrenteData[],
      },
      userId,
    );
  }

  private validateLignes(lignes: Array<{ debit: number; credit: number }>): void {
    const totalDebit  = lignes.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lignes.reduce((s, l) => s + l.credit, 0);
    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `L'écriture modèle est déséquilibrée (débit ${totalDebit} ≠ crédit ${totalCredit}).`,
      );
    }
  }
}
