import { Controller, Post, Body, ValidationPipe, Get, Patch, UseGuards, Request, Response } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(
    @Body(ValidationPipe) dto: SignUpDto,
    @Response({ passthrough: true }) res: ExpressResponse
  ) {
    const result = await this.authService.signUp(dto);
    
    // Устанавливаем JWT в HttpOnly cookie
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });
    
    // Возвращаем данные пользователя без токена
    const { access_token, ...userData } = result;
    return userData;
  }

  @Post('signin')
  async signIn(
    @Body(ValidationPipe) dto: SignInDto,
    @Response({ passthrough: true }) res: ExpressResponse
  ) {
    const result = await this.authService.signIn(dto);
    
    // Устанавливаем JWT в HttpOnly cookie
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });
    
    // Возвращаем данные пользователя без токена
    const { access_token, ...userData } = result;
    return userData;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.validateUser(req.user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body(ValidationPipe) dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @Post('logout')
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }
}
