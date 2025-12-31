
import { Inject, Injectable } from "@nestjs/common";
import { ACCOUNTS_REPOSITORY } from "../ports/accounts.repository.token";
import type { AccountRepository } from "../ports/accounts.repository.interface";
import { CreateAccountDto } from "../../interface/dtos/create-account.dto";
import { CreateAccountResponse } from "../../interface/types/create-account-response";
import { Account } from "../../domain/entities/account.entity";

@Injectable()
export class CreateAccountUseCase{
    constructor(
        @Inject(ACCOUNTS_REPOSITORY) 
        private readonly accountRepository: AccountRepository,
    ){}

    execute(createAccountDto: CreateAccountDto):Promise<Account>{
       const account = new Account(
            createAccountDto.code,
            createAccountDto.name,
            createAccountDto.account_class,
        );
        return this.accountRepository.create(account);

    }
}