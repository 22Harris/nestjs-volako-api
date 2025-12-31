import { Body, Controller, Post } from "@nestjs/common";
import { CreateAccountUseCase } from "../application/use-cases/create_account.usecase";
import { CreateAccountDto } from "./dtos/create-account.dto";
import { CreateAccountResponse } from "./types/create-account-response";
import { Account } from "../domain/entities/account.entity";

@Controller('account')
export class AccountController{

    constructor(private readonly createAccountUseCase: CreateAccountUseCase){}

    @Post()
    create(@Body() createAccountDto : CreateAccountDto):Promise<Account>{
        return this.createAccountUseCase.execute(createAccountDto)
    }
}