import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ObjectifsController } from './interface/objectifs.controller';
import { OBJECTIF_REPOSITORY } from './application/ports/objectif.repository.token';
import { DbObjectifRepository } from './infrastructure/repositories/db.objectif.repository';
import { FindObjectifsUseCase } from './application/use-cases/find-objectifs.usecase';
import { GetObjectifUseCase } from './application/use-cases/get-objectif.usecase';
import { CreateObjectifUseCase } from './application/use-cases/create-objectif.usecase';
import { UpdateObjectifUseCase } from './application/use-cases/update-objectif.usecase';
import { DeleteObjectifUseCase } from './application/use-cases/delete-objectif.usecase';
import { VersementUseCase } from './application/use-cases/versement.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [ObjectifsController],
  providers: [
    FindObjectifsUseCase, GetObjectifUseCase, CreateObjectifUseCase,
    UpdateObjectifUseCase, DeleteObjectifUseCase, VersementUseCase,
    { provide: OBJECTIF_REPOSITORY, useClass: DbObjectifRepository },
  ],
})
export class ObjectifsModule {}
