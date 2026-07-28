import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TvaController } from './tva.controller';
import { TvaService } from './tva.service';
import { CreerDeclarationTvaUseCase } from './application/use-cases/creer-declaration.usecase';
import { ListDeclarationsTvaUseCase } from './application/use-cases/list-declarations.usecase';
import { GetDeclarationTvaUseCase } from './application/use-cases/get-declaration.usecase';
import { SoumettreDeclarationTvaUseCase } from './application/use-cases/soumettre-declaration.usecase';
import { GenererExportTvaUseCase } from './application/use-cases/generer-export-tva.usecase';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TvaController],
  providers: [
    TvaService,
    CreerDeclarationTvaUseCase,
    ListDeclarationsTvaUseCase,
    GetDeclarationTvaUseCase,
    SoumettreDeclarationTvaUseCase,
    GenererExportTvaUseCase,
  ],
})
export class TvaModule {}
