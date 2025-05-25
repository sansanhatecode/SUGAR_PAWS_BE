import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteManyProductsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product ID is required' })
  @IsNumber({}, { each: true, message: 'Each product ID must be a number' })
  @Transform(({ value }) => {
    // Ensure all values are converted to numbers
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return value.map((id) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        typeof id === 'string' ? parseInt(id, 10) : id,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  })
  productIds: number[];
}
