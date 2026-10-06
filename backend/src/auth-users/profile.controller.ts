import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './update-profile.dto';
import { AuthUsersService } from './auth-users.service';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me', version: '1' })
export class ProfileController {
  constructor(private readonly usersService: AuthUsersService) {}

  @Get()
  async getMe(@CurrentUser() currentUser: { sub: string }) {
    return { data: this.usersService.toPublic(await this.usersService.findById(currentUser.sub)) };
  }

  @Patch()
  async updateMe(@CurrentUser() currentUser: { sub: string }, @Body() dto: UpdateProfileDto) {
    return { data: await this.usersService.updateProfile(currentUser.sub, dto) };
  }
}
