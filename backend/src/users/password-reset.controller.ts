import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { parsePasswordResetConfirm, parsePasswordResetRequest } from './users.validation';

@Controller()
export class PasswordResetController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(200)
  @Post('auth/password-reset/request')
  @Post('auth/request-password-reset')
  @Post('password-reset/request')
  @Post('users/password-reset/request')
  @Post('users/password/reset/request')
  @Post('users/request-password-reset')
  request(@Body() body: unknown) {
    const { email } = parsePasswordResetRequest(body);
    return this.usersService.requestPasswordReset(email);
  }

  @HttpCode(200)
  @Post('auth/password-reset/confirm')
  @Post('auth/reset-password')
  @Post('auth/password-reset')
  @Post('password-reset/confirm')
  @Post('users/password-reset/confirm')
  @Post('users/password/reset/confirm')
  @Post('users/reset-password')
  confirm(@Body() body: unknown) {
    const { token, newPassword } = parsePasswordResetConfirm(body);
    return this.usersService.confirmPasswordReset(token, newPassword);
  }
}
