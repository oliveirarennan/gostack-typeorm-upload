import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from './CreateTransactionService';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import Category from '../models/Category';

interface RequestDTO {
  csvFileName: string;
}
interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ csvFileName }: RequestDTO): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    const csvFilePath = path.join(uploadConfig.directory, csvFileName);

    const csvFileExists = await fs.promises.stat(csvFilePath);

    if (!csvFileExists) {
      throw new AppError('File does not exists', 400);
    }

    const csvReadStream = fs.createReadStream(csvFilePath);

    const parserConfig = csvParse({
      delimiter: ', ',
      from_line: 2,
    });

    const parse = csvReadStream.pipe(parserConfig);

    const readedTransactions: TransactionDTO[] = [];
    const readedCategories: string[] = [];

    parse.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value) return;

      readedTransactions.push({ title, type, value, category });
      readedCategories.push(category);
    });

    await new Promise(resolve => parse.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: { title: In(readedCategories) },
    });

    const existentsCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = readedCategories
      .filter(category => !existentsCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      readedTransactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(csvFilePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
