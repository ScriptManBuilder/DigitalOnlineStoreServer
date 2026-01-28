import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private fileUploadService: FileUploadService,
  ) {}

  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    let imageUrl: string | null = null;
    
    if (file) {
      const uploadResult = await this.fileUploadService.uploadFile(file, 'products');
      imageUrl = uploadResult.url;
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl,
      },
    });

    return product;
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, file?: Express.Multer.File) {
    const existingProduct = await this.findOne(id); // Проверка существования

    let imageUrl = existingProduct.imageUrl;

    // Если загружена новая фотография
    if (file) {
      // Удаляем старую фотографию
      if (existingProduct.imageUrl) {
        await this.fileUploadService.deleteFile(existingProduct.imageUrl);
      }
      // Загружаем новую
      const uploadResult = await this.fileUploadService.uploadFile(file, 'products');
      imageUrl = uploadResult.url;
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl,
      },
    });

    return product;
  }

  async remove(id: string) {
    const product = await this.findOne(id); // Проверка существования

    // Удаляем файл фотографии, если он существует
    if (product.imageUrl) {
      await this.fileUploadService.deleteFile(product.imageUrl);
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }
}
