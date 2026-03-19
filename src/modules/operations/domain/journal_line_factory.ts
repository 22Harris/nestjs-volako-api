import { CreateJournalLineDto } from 'src/modules/journal-entries/interface/dtos/create-journal-line.dto';
import { CreateOperationDto } from '../interface/dtos/create-operation.dto';
import { AccountRepository } from 'src/modules/accounts/application/ports/accounts.repository.interface';
import { OPERATION_RULES } from '../interface/constants/operation_rules.constant';

export class JournalLineFactory {
  static async generateJournalLines(
    operation: CreateOperationDto,
    accountRepository: AccountRepository,
    userId: number,
  ): Promise<CreateJournalLineDto[]> {
    const rule = OPERATION_RULES[operation.type];

    if (!rule) {
      throw new Error(`No accounting rules for ${operation.type}`);
    }

    const debitAccount = await accountRepository.findByCode(rule.debit, userId);
    const creditAccount = await accountRepository.findByCode(rule.credit, userId);

    return [
      { accountId: debitAccount.id ? debitAccount.id : 0, debit: operation.amount, credit: 0 },
      { accountId: creditAccount.id ? creditAccount.id : 0, debit: 0, credit: operation.amount },
    ];
  }
}
