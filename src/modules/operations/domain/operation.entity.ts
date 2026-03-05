import { OperationType } from "../interface/types/operation.type";

export class Operation {
  constructor(
    public readonly type: OperationType,
    public readonly date: Date,
    public readonly label: string,
    public readonly id?: number,
    public readonly amount?: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.label || this.label.trim().length === 0) {
      throw new Error("Le libellé de l'opération est obligatoire");
    }
    if (!Object.values(OperationType).includes(this.type)) {
      throw new Error("Type d'opération invalide");
    }
  }
}
