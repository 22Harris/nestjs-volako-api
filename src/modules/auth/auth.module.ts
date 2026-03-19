import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { AuthController } from './interface/auth.controller';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { RefreshUseCase } from './application/use-cases/refresh.usecase';
import { LogoutUseCase } from './application/use-cases/logout.usecase';
import { AUTH_REPOSITORY } from './application/ports/auth.repository.token';
import { DbAuthRepository } from './infrastructure/repositories/db.auth.repository';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

export const JWT_SECRET = process.env.JWT_SECRET || 'volako-secret-key';

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    RefreshUseCase,
    LogoutUseCase,
    JwtAuthGuard,
    { provide: AUTH_REPOSITORY, useClass: DbAuthRepository },
  ],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
