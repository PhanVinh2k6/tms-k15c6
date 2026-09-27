import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../roles/admin.guard';
import { UsersService } from './users.service';
import { parseCreateUser, parseListQuery, parseUpdateUser } from './users.validation';

@Controller('users')
@UseGuards(AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Tạo tài khoản + gửi email kích hoạt kèm mật khẩu tạm. */
  @Post()
  create(@Body() body: unknown) {
    return this.usersService.create(parseCreateUser(body));
  }

  /** Danh sách có tìm kiếm (?q=), lọc (?role=&status=) và phân trang (?page=&pageSize=, mặc định 20). */
  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.usersService.list(parseListQuery(query));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /** Sửa họ tên, email, số điện thoại. Vai trò đổi qua S1-09, trạng thái khoá qua S1-10. */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.usersService.update(id, parseUpdateUser(body));
  }
}
