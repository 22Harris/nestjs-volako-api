import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { USERS_REPOSITORY } from './application/ports/users.repository.token';
import { DbUsersRepository } from './infrastructure/repositories/db.users.repository';
import { FindUsersUseCase } from './application/use-cases/find_users.usecase';
import { CreateUserUseCase } from './application/use-cases/create_user.usecase';
import { UpdateUserUseCase } from './application/use-cases/update_user.usecase';
import { ToggleActiveUseCase } from './application/use-cases/toggle_active.usecase';
import { UsersController } from './interface/users.controller';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule],
  controllers: [UsersController],
  providers: [
    FindUsersUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    ToggleActiveUseCase,
    { provide: USERS_REPOSITORY, useClass: DbUsersRepository },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
