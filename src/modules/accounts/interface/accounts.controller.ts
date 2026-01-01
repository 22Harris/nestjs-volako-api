import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateAccountUseCase } from "../application/use-cases/create_account.usecase";
import { CreateAccountDto } from "./dtos/create-account.dto";
import { Account } from "../domain/entities/account.entity";
import { FindAccountsUseCase } from "../application/use-cases/find_accounts.usecases";

@Controller('account')
export class AccountController{

    constructor(
        private readonly createAccountUseCase: CreateAccountUseCase,
        private readonly findAccountUseCase: FindAccountsUseCase,
    ){}

    @Post()
    create(@Body() createAccountDto : CreateAccountDto):Promise<Account>{
        return this.createAccountUseCase.execute(createAccountDto)
    }

    @Get()
    findAccounts(){
        return this.findAccountUseCase.execute();
    }
}