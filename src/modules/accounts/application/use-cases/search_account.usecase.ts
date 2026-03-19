import { Inject, Injectable } from "@nestjs/common";
import { ACCOUNTS_REPOSITORY } from "../ports/accounts.repository.token";
import type { AccountRepository } from "../ports/accounts.repository.interface";
import { Account } from "../../domain/entities/account.entity";

@Injectable()
export class SearchAccountUseCase{
    constructor(
        @Inject(ACCOUNTS_REPOSITORY)
        private readonly accountRepository: AccountRepository
    ){}

    execute(query: string, userId: number): Promise<Account[]>{
        return this.accountRepository.searchAccount(query, userId)
    }
}
