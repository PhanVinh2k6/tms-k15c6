import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { parsePasswordResetConfirm, parsePasswordResetRequest } from './users.validation';

/** S1-03: API công khai (không cần đăng nhập) cho luồng quên mật khẩu. */
@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly usersService: UsersService) {}

  @Post('request')
  @HttpCode(200)
  request(@Body() body: unknown) {
    const { email } = parsePasswordResetRequest(body);
    return this.usersService.requestPasswordReset(email);
  }

  @Post('confirm')
  @HttpCode(200)
  confirm(@Body() body: unknown) {
    const { token, newPassword } = parsePasswordResetConfirm(body);
    return this.usersService.confirmPasswordReset(token, newPassword);
  }
}
