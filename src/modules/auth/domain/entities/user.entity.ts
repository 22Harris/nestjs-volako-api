import { Role } from 'src/common/enums/role.enum';

export class User {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly id?: number,
    public readonly role: Role = Role.ASSISTANT,
    public readonly isActive: boolean = true,
    public readonly twoFactorSecret?: string,
    public readonly twoFactorEnabled: boolean = false,
  ) {}
}
