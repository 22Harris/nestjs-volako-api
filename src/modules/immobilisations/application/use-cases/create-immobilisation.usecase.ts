import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IMMOBILISATIONS_REPOSITORY } from '../ports/immobilisations.repository.token';
import type { ImmobilisationsRepository } from '../ports/immobilisations.repository.interface';
import { Immobilisation } from '../../domain/entities/immobilisation.entity';
import { calculerTableauAmortissement } from '../utils/amortissement.calculator';

export interface CreateImmobilisationDto {
  libelle: string;
  dateAcquisition: Date;
  valeurBrute: number;
  dureeAmortissement: number;
  methode: 'LINEAIRE' | 'DEGRESSIF';
  compteBilanCode: string;
  compteAmortissementCode: string;
  compteChargeCode: string;
}

@Injectable()
export class CreateImmobilisationUseCase {
  constructor(
    @Inject(IMMOBILISATIONS_REPOSITORY)
    private readonly repo: ImmobilisationsRepository,
  ) {}

  async execute(dto: CreateImmobilisationDto, userId: number): Promise<Immobilisation> {
    if (dto.valeurBrute <= 0) throw new BadRequestException('La valeur brute doit être positive');
    if (dto.dureeAmortissement < 1) throw new BadRequestException('La durée doit être au moins 1 an');

    const lignes = calculerTableauAmortissement(
      dto.valeurBrute,
      dto.dureeAmortissement,
      dto.methode,
      dto.dateAcquisition,
    );

    const immo = new Immobilisation(
      dto.libelle,
      dto.dateAcquisition,
      dto.valeurBrute,
      dto.dureeAmortissement,
      dto.methode,
      dto.compteBilanCode,
      dto.compteAmortissementCode,
      dto.compteChargeCode,
      'ACTIF',
      lignes,
    );

    return this.repo.create(immo, userId);
  }
}
