import { Account } from "../../domain/entities/account.entity";

export interface AccountRepository{
    create(account : Account): Promise<Account>;
}