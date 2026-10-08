import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { parsePasswordResetConfirm } from './users.validation';

@Controller('auth')
export class ActivationController {
  /** Connect the public activation endpoint to managed accounts. */
  constructor(private readonly usersService: UsersService) {}

  /** Validate the token and password request body, then activate the matching account. */
  @Post('activate')
  @HttpCode(200)
  activate(@Body() body: unknown) {
    const { token, newPassword } = parsePasswordResetConfirm(body);
    return this.usersService.activateAccount(token, newPassword);
  }
}
