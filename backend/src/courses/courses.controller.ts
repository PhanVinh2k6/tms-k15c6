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
import { CoursesService } from './courses.service';
import {
  parseCheckCodeQuery,
  parseCreateCourse,
  parseListCoursesQuery,
  parseUpdateCourse,
} from './courses.validation';

/** S2-05: Danh mục môn học (Course Catalog). */
@Controller('courses')
@UseGuards(PermissionGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /** Danh sách môn học (?page=&pageSize=&q=&programId=&status=). */
  @Get()
  @RequirePermission(Permission.COURSE_READ)
  list(@Query() query: Record<string, unknown>) {
    return this.coursesService.list(parseListCoursesQuery(query));
  }

  /** Kiểm tra trùng mã môn học trước khi lưu: ?code=&excludeId= */
  @Get('check-code')
  @RequirePermission(Permission.COURSE_READ)
  checkCode(@Query() query: Record<string, unknown>) {
    const { code, excludeId } = parseCheckCodeQuery(query);
    return this.coursesService.checkCode(code, excludeId);
  }

  @Get(':id')
  @RequirePermission(Permission.COURSE_READ)
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  /** Khai báo mã, tên, số buổi, trọng số, mô tả chuẩn đầu ra. */
  @Post()
  @RequirePermission(Permission.COURSE_WRITE)
  create(@Body() body: unknown) {
    return this.coursesService.create(parseCreateCourse(body));
  }

  /** Cập nhật thông tin môn học. */
  @Patch(':id')
  @RequirePermission(Permission.COURSE_WRITE)
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.coursesService.update(id, parseUpdateCourse(body));
  }

  /** Ngừng áp dụng môn học. */
  @Post(':id/deactivate')
  @RequirePermission(Permission.COURSE_WRITE)
  @HttpCode(200)
  deactivate(@Param('id') id: string) {
    return this.coursesService.deactivate(id);
  }

  /** Áp dụng lại môn học. */
  @Post(':id/activate')
  @RequirePermission(Permission.COURSE_WRITE)
  @HttpCode(200)
  activate(@Param('id') id: string) {
    return this.coursesService.activate(id);
  }

  /** Gán môn học vào chương trình (Một môn học dùng lại được ở nhiều chương trình). */
  @Post(':id/programs/:programId')
  @RequirePermission(Permission.COURSE_WRITE)
  @HttpCode(200)
  assignToProgram(
    @Param('id') id: string,
    @Param('programId') programId: string,
  ) {
    return this.coursesService.assignToProgram(id, programId);
  }

  /** Gỡ môn học khỏi một chương trình. */
  @Delete(':id/programs/:programId')
  @RequirePermission(Permission.COURSE_WRITE)
  @HttpCode(200)
  removeFromProgram(
    @Param('id') id: string,
    @Param('programId') programId: string,
  ) {
    return this.coursesService.removeFromProgram(id, programId);
  }

  /** Xoá môn học — môn đã có lớp học thì không xoá được. */
  @Delete(':id')
  @RequirePermission(Permission.COURSE_WRITE)
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
