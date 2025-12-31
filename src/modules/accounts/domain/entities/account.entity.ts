export class Account{
    constructor(
         public readonly code: string,
          public readonly name: string,
           public readonly account_class: number,
            public readonly id?: number,
    ){}
}