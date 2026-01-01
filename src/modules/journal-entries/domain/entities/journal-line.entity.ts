export class JournalLine {
  constructor(
    public readonly accountId: number,
    public readonly debit: number,
    public readonly credit: number,
    public readonly id?: number,
  ) {}
}
