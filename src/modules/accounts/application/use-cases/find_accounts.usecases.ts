import { Inject, Injectable } from "@nestjs/common";
import { ACCOUNTS_REPOSITORY } from "../ports/accounts.repository.token";
import type { AccountRepository } from "../ports/accounts.repository.interface";
import { Account } from "../../domain/entities/account.entity";

@Injectable()
export class FindAccountsUseCase{
    constructor(
        @Inject(ACCOUNTS_REPOSITORY)
        private readonly accountRepository: AccountRepository
    ){}

    execute():Promise<Account[]>{
        return this.accountRepository.findAccounts()
    }
}