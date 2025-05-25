import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Get all categories with their IDs and names
   * @returns Array of categories with id and name
   */
  @Get()
  async getAllCategories(): Promise<CategoryResponseDto> {
    return this.categoriesService.getAllCategories();
  }
}
