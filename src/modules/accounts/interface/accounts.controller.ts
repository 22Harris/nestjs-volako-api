import { UpdateAccountUseCase } from './../application/use-cases/update_account.usecase';
import { SearchAccountUseCase } from './../application/use-cases/search_account.usecase';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { CreateAccountUseCase } from "../application/use-cases/create_account.usecase";
import { CreateAccountDto } from "./dtos/create-account.dto";
import { Account } from "../domain/entities/account.entity";
import { FindAccountsUseCase } from "../application/use-cases/find_accounts.usecase";

@Controller('account')
export class AccountController{

    constructor(
        private readonly createAccountUseCase: CreateAccountUseCase,
        private readonly findAccountUseCase: FindAccountsUseCase,
        private readonly searchAccountUseCase: SearchAccountUseCase,
        private readonly updateAccountUseCase: UpdateAccountUseCase,
    ){}

    @Post()
    create(@Body() createAccountDto : CreateAccountDto):Promise<Account>{
        return this.createAccountUseCase.execute(createAccountDto)
    }

    @Get()
    findAccounts(){
        return this.findAccountUseCase.execute();
    }

    @Get('search')
    searchAccount(@Query('term') term:string){
        return this.searchAccountUseCase.execute(term);
    }

    @Patch(':id')
    updateAccount(@Param('id', ParseIntPipe) id: number, @Body() account: CreateAccountDto):Promise<Account>{
        console.log('CONTROLLER : ', id, ' : ', account)
        return this.updateAccountUseCase.execute(id, account);
    }
}