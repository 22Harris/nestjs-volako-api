import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './interface/auth.controller';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { AUTH_REPOSITORY } from './application/ports/auth.repository.token';
import { DbAuthRepository } from './infrastructure/repositories/db.auth.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    { provide: AUTH_REPOSITORY, useClass: DbAuthRepository },
  ],
})
export class AuthModule {}
