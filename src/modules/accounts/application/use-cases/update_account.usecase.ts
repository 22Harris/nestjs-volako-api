import { Inject, Injectable } from "@nestjs/common";
import { ACCOUNTS_REPOSITORY } from "../ports/accounts.repository.token";
import type { AccountRepository } from "../ports/accounts.repository.interface";
import { Account } from "../../domain/entities/account.entity";
import { CreateAccountDto } from "../../interface/dtos/create-account.dto";

@Injectable()
export class UpdateAccountUseCase{
    constructor(
        @Inject(ACCOUNTS_REPOSITORY)
        private readonly accountRepository: AccountRepository
    ){}

    execute(accountId: number, account: CreateAccountDto): Promise<Account>{
        return this.accountRepository.updateAccount(accountId, account);
    }
}