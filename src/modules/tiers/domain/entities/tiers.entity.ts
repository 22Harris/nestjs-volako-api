export class Tiers {
  constructor(
    public readonly nom: string,
    public readonly type: string,
    public readonly id?: number,
    public readonly siret?: string,
    public readonly email?: string,
    public readonly telephone?: string,
    public readonly adresse?: string,
    public readonly accountId?: number,
    public readonly accountCode?: string,
    public readonly accountName?: string,
  ) {}
}
