import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FindUsersUseCase } from '../application/use-cases/find_users.usecase';
import { CreateUserUseCase } from '../application/use-cases/create_user.usecase';
import { UpdateUserUseCase } from '../application/use-cases/update_user.usecase';
import { ToggleActiveUseCase } from '../application/use-cases/toggle_active.usecase';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(
    private readonly findUsers: FindUsersUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly toggleActive: ToggleActiveUseCase,
  ) {}

  @Get()
  list() {
    return this.findUsers.execute();
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() actorId: number) {
    return this.createUser.execute(dto, actorId);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @CurrentUser() actorId: number) {
    return this.updateUser.execute(id, dto, actorId);
  }

  @Patch(':id/desactiver')
  @HttpCode(200)
  toggleActiveUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() actorId: number) {
    return this.toggleActive.execute(id, actorId);
  }
}
