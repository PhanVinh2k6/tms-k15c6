import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionGuard } from '../roles/permission.guard';
import { Permission } from '../roles/permission.types';
import { RequirePermission } from '../roles/require-permission.decorator';
import { ProgramsService } from './programs.service';
import {
  parseCheckCodeQuery,
  parseCreateProgram,
  parseListProgramsQuery,
  parseUpdateProgram,
} from './programs.validation';

/** S2-04: Danh mục chương trình đào tạo. */
@Controller('programs')
@UseGuards(PermissionGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  /** Danh sách chương trình đào tạo (?page=&pageSize=&q=&status=). */
  @Get()
  @RequirePermission(Permission.PROGRAM_READ)
  list(@Query() query: Record<string, unknown>) {
    return this.programsService.list(parseListProgramsQuery(query));
  }

  /** Kiểm tra trùng mã trước khi lưu: ?code=&excludeId= */
  @Get('check-code')
  @RequirePermission(Permission.PROGRAM_READ)
  checkCode(@Query() query: Record<string, unknown>) {
    const { code, excludeId } = parseCheckCodeQuery(query);
    return this.programsService.checkCode(code, excludeId);
  }

  @Get(':id')
  @RequirePermission(Permission.PROGRAM_READ)
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  /** Khai báo mã, tên, mô tả, tổng thời lượng, học phí chuẩn, trạng thái. */
  @Post()
  @RequirePermission(Permission.PROGRAM_WRITE)
  create(@Body() body: unknown) {
    return this.programsService.create(parseCreateProgram(body));
  }

  /** Cập nhật thông tin chương trình đào tạo. */
  @Patch(':id')
  @RequirePermission(Permission.PROGRAM_WRITE)
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.programsService.update(id, parseUpdateProgram(body));
  }

  /** Ngừng áp dụng chương trình. */
  @Post(':id/deactivate')
  @RequirePermission(Permission.PROGRAM_WRITE)
  @HttpCode(200)
  deactivate(@Param('id') id: string) {
    return this.programsService.deactivate(id);
  }

  /** Áp dụng lại chương trình. */
  @Post(':id/activate')
  @RequirePermission(Permission.PROGRAM_WRITE)
  @HttpCode(200)
  activate(@Param('id') id: string) {
    return this.programsService.activate(id);
  }

  /** Xoá chương trình — chương trình đang có lớp chạy không được xoá. */
  @Delete(':id')
  @RequirePermission(Permission.PROGRAM_WRITE)
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }
}
