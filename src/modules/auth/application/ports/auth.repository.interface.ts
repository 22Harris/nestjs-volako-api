import { User } from '../../domain/entities/user.entity';

export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
}
