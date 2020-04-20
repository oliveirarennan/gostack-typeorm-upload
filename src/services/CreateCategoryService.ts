import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface CategoryDTO {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: CategoryDTO): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const checkCategoryExists = await categoryRepository.findOne({
      where: { title },
    });

    if (checkCategoryExists) {
      return checkCategoryExists;
    }

    const category = categoryRepository.create({
      title,
    });

    await categoryRepository.save(category);

    return category;
  }
}

export default CreateCategoryService;
