import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Post('login')
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) { return this.authService.refresh(dto); }

  /** Delegate logout for the authenticated user and optional session ID. */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: { sub: string; sid?: string }) { return this.authService.logout(user.sub, user.sid); }
}
