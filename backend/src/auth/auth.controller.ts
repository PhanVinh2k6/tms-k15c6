import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập bằng email/password' })
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Post('refresh')
  @ApiOperation({ summary: 'Đổi refresh token lấy cặp token mới' })
  refresh(@Body() dto: RefreshTokenDto) { return this.authService.refresh(dto); }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thu hồi refresh token và kết thúc phiên' })
  logout(@CurrentUser() user: { sub: string }) { return this.authService.logout(user.sub); }
}
