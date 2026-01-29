import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, MinLength, MaxLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString({ message: 'Product name must be a string' })
  @IsNotEmpty({ message: 'Product name is required' })
  @MinLength(3, { message: 'Product name must be at least 3 characters' })
  @MaxLength(100, { message: 'Product name must not exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @ValidateIf((o) => o.description && o.description.length > 0)
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0.01, { message: 'Minimum price is $0.01' })
  @Max(999999.99, { message: 'Maximum price is $999,999.99' })
  price: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
