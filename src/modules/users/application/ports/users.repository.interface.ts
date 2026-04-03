import { Role } from 'src/common/enums/role.enum';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string; // déjà hashé
  role: Role;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: Role;
}

export interface UsersRepository {
  findAll(): Promise<UserProfile[]>;
  findById(id: number): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  create(data: CreateUserData): Promise<UserProfile>;
  update(id: number, data: UpdateUserData): Promise<UserProfile>;
  setActive(id: number, isActive: boolean): Promise<UserProfile>;
  countByRole(role: Role): Promise<number>;
}
