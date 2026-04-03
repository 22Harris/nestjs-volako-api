import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../ports/users.repository.token';
import type { UsersRepository, UserProfile } from '../ports/users.repository.interface';

@Injectable()
export class FindUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: UsersRepository,
  ) {}

  execute(): Promise<UserProfile[]> {
    return this.repo.findAll();
  }
}
