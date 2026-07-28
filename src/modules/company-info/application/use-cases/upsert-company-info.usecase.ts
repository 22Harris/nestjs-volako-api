import { Inject, Injectable } from '@nestjs/common';
import { COMPANY_INFO_REPOSITORY } from '../ports/company-info.repository.token';
import type { CompanyInfoRepository } from '../ports/company-info.repository.interface';
import { CompanyInfo } from '../../domain/entities/company-info.entity';

@Injectable()
export class UpsertCompanyInfoUseCase {
  constructor(
    @Inject(COMPANY_INFO_REPOSITORY)
    private readonly repo: CompanyInfoRepository,
  ) {}

  execute(data: Omit<CompanyInfo, 'id' | 'userId'>, userId: number): Promise<CompanyInfo> {
    return this.repo.upsert(new CompanyInfo(
      data.nom,
      undefined,
      userId,
      data.siret,
      data.numTva,
      data.adresse,
      data.email,
      data.iban,
    ), userId);
  }
}
