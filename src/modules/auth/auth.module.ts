import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { AuthController } from './interface/auth.controller';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { RefreshUseCase } from './application/use-cases/refresh.usecase';
import { LogoutUseCase } from './application/use-cases/logout.usecase';
import { SetupAdminUseCase } from './application/use-cases/setup_admin.usecase';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.usecase';
import { ChangePasswordUseCase } from './application/use-cases/change-password.usecase';
import { Setup2faUseCase } from './application/use-cases/setup-2fa.usecase';
import { Enable2faUseCase } from './application/use-cases/enable-2fa.usecase';
import { Disable2faUseCase } from './application/use-cases/disable-2fa.usecase';
import { Verify2faUseCase } from './application/use-cases/verify-2fa.usecase';
import { AUTH_REPOSITORY } from './application/ports/auth.repository.token';
import { DbAuthRepository } from './infrastructure/repositories/db.auth.repository';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AccountModule } from '../accounts/accounts.module';

export const JWT_SECRET = process.env.JWT_SECRET!;

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    forwardRef(() => AccountModule),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    RefreshUseCase,
    LogoutUseCase,
    SetupAdminUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    Setup2faUseCase,
    Enable2faUseCase,
    Disable2faUseCase,
    Verify2faUseCase,
    JwtAuthGuard,
    { provide: AUTH_REPOSITORY, useClass: DbAuthRepository },
  ],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
