import { CompanyInfo } from '../../domain/entities/company-info.entity';

export interface CompanyInfoRepository {
  findByUser(userId: number): Promise<CompanyInfo | null>;
  upsert(data: CompanyInfo, userId: number): Promise<CompanyInfo>;
}
