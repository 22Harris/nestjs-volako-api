import { GetAccountByAccountId } from './../application/use-cases/get_account_by_accountID.usecase';
import { UpdateAccountUseCase } from './../application/use-cases/update_account.usecase';
import { SearchAccountUseCase } from './../application/use-cases/search_account.usecase';
import { DeleteAccountUseCase } from './../application/use-cases/delete_account.usecase';
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { CreateAccountUseCase } from "../application/use-cases/create_account.usecase";
import { CreateAccountDto } from "./dtos/create-account.dto";
import { Account } from "../domain/entities/account.entity";
import { FindAccountsUseCase } from "../application/use-cases/find_accounts.usecase";

@Controller('account')
export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly findAccountUseCase: FindAccountsUseCase,
    private readonly searchAccountUseCase: SearchAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly getAccountByAccountId: GetAccountByAccountId,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto): Promise<Account> {
    return this.createAccountUseCase.execute(createAccountDto);
  }

  @Get()
  findAccounts() {
    return this.findAccountUseCase.execute();
  }

  @Get('search')
  searchAccount(@Query('term') term: string) {
    return this.searchAccountUseCase.execute(term);
  }

  @Patch(':id')
  updateAccount(@Param('id', ParseIntPipe) id: number, @Body() account: CreateAccountDto): Promise<Account> {
    return this.updateAccountUseCase.execute(id, account);
  }

  @Get(':id')
  getAccount(@Param('id', ParseIntPipe) id: number): Promise<Account | null> {
    return this.getAccountByAccountId.execute(id);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteAccount(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.deleteAccountUseCase.execute(id);
  }
}
