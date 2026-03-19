import { User } from '../../domain/entities/user.entity';

export interface RefreshTokenData {
  id: number;
  token: string;
  userId: number;
  expiresAt: Date;
}

export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(user: User): Promise<User>;
  createRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  findRefreshToken(token: string): Promise<RefreshTokenData | null>;
  deleteRefreshToken(token: string): Promise<void>;
}
