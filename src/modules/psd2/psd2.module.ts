import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RapprochementModule } from '../rapprochement/rapprochement.module';
import { Psd2Controller } from './interface/psd2.controller';
import { COMPTE_BANK_REPOSITORY } from './application/ports/compte-bank.repository.interface';
import { PSD2_PROVIDER } from './application/ports/psd2-provider.interface';
import { DbCompteBankRepository } from './infrastructure/repositories/db.compte-bank.repository';
import { MockPsd2Provider } from './infrastructure/providers/mock.psd2-provider';
import { InitierAutorisationUseCase } from './application/use-cases/initier-autorisation.usecase';
import { EnregistrerCompteBankUseCase } from './application/use-cases/enregistrer-compte-bank.usecase';
import { ListerComptesBankUseCase } from './application/use-cases/lister-comptes-bank.usecase';
import { SupprimerCompteBankUseCase } from './application/use-cases/supprimer-compte-bank.usecase';
import { SynchroniserTransactionsUseCase } from './application/use-cases/synchroniser-transactions.usecase';

@Module({
  imports: [PrismaModule, AuthModule, RapprochementModule],
  controllers: [Psd2Controller],
  providers: [
    InitierAutorisationUseCase,
    EnregistrerCompteBankUseCase,
    ListerComptesBankUseCase,
    SupprimerCompteBankUseCase,
    SynchroniserTransactionsUseCase,
    { provide: COMPTE_BANK_REPOSITORY, useClass: DbCompteBankRepository },
    // Swap MockPsd2Provider → StetPsd2Provider when real bank credentials are configured
    { provide: PSD2_PROVIDER, useClass: MockPsd2Provider },
  ],
})
export class Psd2Module {}
