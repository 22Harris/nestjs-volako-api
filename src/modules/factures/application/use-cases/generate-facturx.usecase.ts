import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FACTURE_REPOSITORY } from '../ports/facture.repository.token';
import type { FactureRepository } from '../ports/facture.repository.interface';
import { COMPANY_INFO_REPOSITORY } from 'src/modules/company-info/application/ports/company-info.repository.token';
import type { CompanyInfoRepository } from 'src/modules/company-info/application/ports/company-info.repository.interface';
import { generateFacturXXml, FacturXOptions } from '../utils/facturx.generator';

@Injectable()
export class GenerateFacturXUseCase {
  constructor(
    @Inject(FACTURE_REPOSITORY)
    private readonly factureRepo: FactureRepository,
    @Inject(COMPANY_INFO_REPOSITORY)
    private readonly companyRepo: CompanyInfoRepository,
  ) {}

  async execute(factureId: number, userId: number, options?: FacturXOptions): Promise<string> {
    const facture = await this.factureRepo.findById(factureId, userId);
    if (!facture) throw new NotFoundException('Facture introuvable');

    const company = await this.companyRepo.findByUser(userId);
    if (!company) {
      throw new BadRequestException(
        'Informations société non configurées. Renseignez-les via PUT /company-info.',
      );
    }

    return generateFacturXXml(facture, company, options);
  }
}
