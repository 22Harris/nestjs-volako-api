import { GetAccountByAccountId } from './../application/use-cases/get_account_by_accountID.usecase';
import { UpdateAccountUseCase } from './../application/use-cases/update_account.usecase';
import { SearchAccountUseCase } from './../application/use-cases/search_account.usecase';
import { DeleteAccountUseCase } from './../application/use-cases/delete_account.usecase';
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CreateAccountUseCase } from "../application/use-cases/create_account.usecase";
import { CreateAccountDto } from "./dtos/create-account.dto";
import { Account } from "../domain/entities/account.entity";
import { FindAccountsUseCase } from "../application/use-cases/find_accounts.usecase";
import { InitPcgUseCase } from "../application/use-cases/init_pcg.usecase";
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly findAccountUseCase: FindAccountsUseCase,
    private readonly searchAccountUseCase: SearchAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly getAccountByAccountId: GetAccountByAccountId,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
    private readonly initPcgUseCase: InitPcgUseCase,
  ) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto, @CurrentUser() userId: number): Promise<Account> {
    return this.createAccountUseCase.execute(createAccountDto, userId);
  }

  @Get()
  findAccounts(@CurrentUser() userId: number) {
    return this.findAccountUseCase.execute(userId);
  }

  @Get('search')
  searchAccount(@Query('term') term: string, @CurrentUser() userId: number) {
    return this.searchAccountUseCase.execute(term, userId);
  }

  @Patch(':id')
  updateAccount(@Param('id', ParseIntPipe) id: number, @Body() account: CreateAccountDto, @CurrentUser() userId: number): Promise<Account> {
    return this.updateAccountUseCase.execute(id, account, userId);
  }

  @Get(':id')
  getAccount(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<Account | null> {
    return this.getAccountByAccountId.execute(id, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteAccount(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<void> {
    return this.deleteAccountUseCase.execute(id, userId);
  }

  @Post('init-pcg')
  initPcg(@CurrentUser() userId: number): Promise<{ created: number; skipped: number }> {
    return this.initPcgUseCase.execute(userId);
  }
}
