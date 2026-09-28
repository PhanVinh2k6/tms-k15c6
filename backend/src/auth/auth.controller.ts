import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email?: string; password?: string }) {
    if (typeof body.email !== 'string' || typeof body.password !== 'string' || !body.email.trim() || !body.password) {
      throw new BadRequestException('Email và mật khẩu là bắt buộc');
    }
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request) {
    return { user: this.authService.getPublicUser(request.authUser!.id) };
  }
}
