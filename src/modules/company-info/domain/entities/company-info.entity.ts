export class CompanyInfo {
  constructor(
    public readonly nom: string,
    public readonly id?: number,
    public readonly userId?: number,
    public readonly siret?: string,
    public readonly numTva?: string,
    public readonly adresse?: string,
    public readonly email?: string,
    public readonly iban?: string,
  ) {}
}
