import { Inject, Injectable } from '@nestjs/common';
import { COMPTE_BANK_REPOSITORY } from '../ports/compte-bank.repository.interface';
import type { CompteBankRepository } from '../ports/compte-bank.repository.interface';
import { PSD2_PROVIDER } from '../ports/psd2-provider.interface';
import type { Psd2Provider } from '../ports/psd2-provider.interface';
import { CompteBank } from '../../domain/entities/compte-bank.entity';

export interface EnregistrerCompteBankDto {
  nom: string;
  iban: string;
  provider: string;
  code: string;
  redirectUri: string;
}

@Injectable()
export class EnregistrerCompteBankUseCase {
  constructor(
    @Inject(COMPTE_BANK_REPOSITORY)
    private readonly repo: CompteBankRepository,
    @Inject(PSD2_PROVIDER)
    private readonly provider: Psd2Provider,
  ) {}

  async execute(dto: EnregistrerCompteBankDto, userId: number): Promise<CompteBank> {
    const tokens = await this.provider.exchangeCode(dto.code, dto.redirectUri);
    return this.repo.create(
      {
        nom:           dto.nom,
        iban:          dto.iban.toUpperCase().replaceAll(' ', ''),
        provider:      dto.provider,
        accessToken:   tokens.accessToken,
        refreshToken:  tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
      },
      userId,
    );
  }
}
