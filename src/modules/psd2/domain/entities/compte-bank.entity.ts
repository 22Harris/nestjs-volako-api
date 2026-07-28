export class CompteBank {
  constructor(
    public readonly nom: string,
    public readonly iban: string,
    public readonly provider: string,
    public readonly accessToken: string,
    public readonly actif: boolean = true,
    public readonly refreshToken?: string,
    public readonly tokenExpiresAt?: Date,
    public readonly derniereSync?: Date,
    public readonly id?: number,
    public readonly userId?: number,
  ) {}

  get tokenExpired(): boolean {
    if (!this.tokenExpiresAt) return false;
    return this.tokenExpiresAt <= new Date();
  }
}
