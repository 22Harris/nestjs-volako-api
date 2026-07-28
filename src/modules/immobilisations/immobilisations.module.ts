import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { JournalEntryModule } from '../journal-entries/journal-entries.module';
import { ImmobilisationsController } from './interface/immobilisations.controller';
import { CreateImmobilisationUseCase } from './application/use-cases/create-immobilisation.usecase';
import { FindImmobilisationsUseCase } from './application/use-cases/find-immobilisations.usecase';
import { GetImmobilisationUseCase } from './application/use-cases/get-immobilisation.usecase';
import { ComptabiliserDotationUseCase } from './application/use-cases/comptabiliser-dotation.usecase';
import { CederImmobilisationUseCase } from './application/use-cases/ceder-immobilisation.usecase';
import { DeleteImmobilisationUseCase } from './application/use-cases/delete-immobilisation.usecase';
import { IMMOBILISATIONS_REPOSITORY } from './application/ports/immobilisations.repository.token';
import { DbImmobilisationsRepository } from './infrastructure/repositories/db.immobilisations.repository';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule, JournalEntryModule],
  controllers: [ImmobilisationsController],
  providers: [
    CreateImmobilisationUseCase,
    FindImmobilisationsUseCase,
    GetImmobilisationUseCase,
    ComptabiliserDotationUseCase,
    CederImmobilisationUseCase,
    DeleteImmobilisationUseCase,
    {
      provide: IMMOBILISATIONS_REPOSITORY,
      useClass: DbImmobilisationsRepository,
    },
  ],
})
export class ImmobilisationsModule {}
