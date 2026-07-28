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
  updateProfile(id: number, name: string, email: string): Promise<User>;
  updatePassword(id: number, hashedPassword: string): Promise<void>;
  createRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  findRefreshToken(token: string): Promise<RefreshTokenData | null>;
  deleteRefreshToken(token: string): Promise<void>;
  setTwoFactorSecret(userId: number, secret: string): Promise<void>;
  enableTwoFactor(userId: number): Promise<void>;
  disableTwoFactor(userId: number): Promise<void>;
}
