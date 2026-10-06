import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Xem hồ sơ cá nhân của user đang đăng nhập' })
  async getMe(@CurrentUser() currentUser: { sub: string }) {
    return { data: this.usersService.toPublic(await this.usersService.findById(currentUser.sub)) };
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân của user đang đăng nhập' })
  async updateMe(@CurrentUser() currentUser: { sub: string }, @Body() dto: UpdateProfileDto) {
    return { data: await this.usersService.updateProfile(currentUser.sub, dto) };
  }
}
