import { Controller, Post, Body, ValidationPipe, Get, UseGuards, Request, Response } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AdminService } from './admin.service';
import { AdminSignInDto } from './dto/admin.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('signin')
  async signIn(
    @Body(ValidationPipe) dto: AdminSignInDto,
    @Response({ passthrough: true }) res: ExpressResponse
  ) {
    const result = await this.adminService.signIn(dto);
    
    // Устанавливаем JWT в HttpOnly cookie
    res.cookie('admin_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });
    
    // Возвращаем данные администратора без токена
    const { access_token, ...adminData } = result;
    return adminData;
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  async getProfile(@Request() req) {
    return this.adminService.validateAdmin(req.user.adminId);
  }

  @Post('logout')
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Admin logged out successfully' };
  }

  @Get('users')
  @UseGuards(AdminJwtAuthGuard)
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }
}
