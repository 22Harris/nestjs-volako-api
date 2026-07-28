import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CompanyInfoController } from './interface/company-info.controller';
import { GetCompanyInfoUseCase } from './application/use-cases/get-company-info.usecase';
import { UpsertCompanyInfoUseCase } from './application/use-cases/upsert-company-info.usecase';
import { COMPANY_INFO_REPOSITORY } from './application/ports/company-info.repository.token';
import { DbCompanyInfoRepository } from './infrastructure/repositories/db.company-info.repository';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CompanyInfoController],
  providers: [
    GetCompanyInfoUseCase,
    UpsertCompanyInfoUseCase,
    { provide: COMPANY_INFO_REPOSITORY, useClass: DbCompanyInfoRepository },
  ],
  exports: [GetCompanyInfoUseCase, COMPANY_INFO_REPOSITORY],
})
export class CompanyInfoModule {}
