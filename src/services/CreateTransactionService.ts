import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import CreateCategoryService from './CreateCategoryService';
import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: TransactionDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('insufficient funds', 400);
    }

    const createCategory = new CreateCategoryService();

    const categoryData = await createCategory.execute({ title: category });

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryData.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
