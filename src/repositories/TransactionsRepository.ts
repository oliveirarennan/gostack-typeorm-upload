import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions: Transaction[] = await this.find();

    const reducer = (accumulator: number, currentValue: Transaction): number =>
      accumulator + Number(currentValue.value);

    const incomeTransactions = transactions.filter(
      transaction => transaction.type === 'income',
    );

    const incomeValue = incomeTransactions.reduce(reducer, 0);

    const outcomeTransactions = transactions.filter(
      transaction => transaction.type === 'outcome',
    );

    const outcomeValue = outcomeTransactions.reduce(reducer, 0);

    const balance: Balance = {
      income: incomeValue,
      outcome: outcomeValue,
      total: incomeValue - outcomeValue,
    };

    return balance;
  }
}

export default TransactionsRepository;
