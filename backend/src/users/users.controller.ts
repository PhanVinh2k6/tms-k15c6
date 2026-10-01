import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminGuard } from '../roles/admin.guard';
import { buildHandoverWarning, ClassAssignmentLookup, HANDOVER_CHECK_FAILED, HandoverWarning } from './class-assignment';
import { UsersService } from './users.service';
import { parseCreateUser, parseListQuery, parseLockInput, parseUpdateUser } from './users.validation';

@Controller('users')
@UseGuards(AdminGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly classAssignments: ClassAssignmentLookup,
  ) {}

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

  /**
   * Khoá tài khoản (S1-10). Bắt buộc có `reason`. Khoá sẽ đổi status sang LOCKED và tăng
   * sessionVersion; việc chặn đăng nhập / phiên đang mở do Auth (S1-01/S1-02) làm khi tích hợp.
   * `handoverWarning` khác null khi người đó đang phụ trách lớp học nào đó và cần bàn giao.
   */
  @Post(':id/lock')
  @HttpCode(200)
  async lock(@Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    const { reason } = parseLockInput(body);
    const user = this.usersService.lock(id, reason, req.actor!.id);

    // Đã khoá rồi thì dù không đọc được danh sách lớp cũng không được báo lỗi (làm quản trị viên tưởng chưa khoá).
    let handoverWarning: HandoverWarning | null;
    try {
      handoverWarning = buildHandoverWarning(await this.classAssignments.findClassesOf(id));
    } catch {
      handoverWarning = HANDOVER_CHECK_FAILED;
    }
    return { user, handoverWarning };
  }

  /** Mở khoá: trả tài khoản về trạng thái trước khi khoá. */
  @Post(':id/unlock')
  @HttpCode(200)
  unlock(@Param('id') id: string) {
    return { user: this.usersService.unlock(id) };
  }

  /** Xoá hẳn tài khoản (chỉ Quản trị hệ thống). Không tự xoá mình, không xoá Admin cuối cùng. */
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.remove(id, req.actor!.id);
  }
}
