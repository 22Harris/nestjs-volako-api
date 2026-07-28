import { Inject, Injectable } from '@nestjs/common';
import { COMPANY_INFO_REPOSITORY } from '../ports/company-info.repository.token';
import type { CompanyInfoRepository } from '../ports/company-info.repository.interface';
import { CompanyInfo } from '../../domain/entities/company-info.entity';

@Injectable()
export class GetCompanyInfoUseCase {
  constructor(
    @Inject(COMPANY_INFO_REPOSITORY)
    private readonly repo: CompanyInfoRepository,
  ) {}

  execute(userId: number): Promise<CompanyInfo | null> {
    return this.repo.findByUser(userId);
  }
}
