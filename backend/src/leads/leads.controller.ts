import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../roles/permission.guard';
import { Permission } from '../roles/permission.types';
import { RequirePermission } from '../roles/require-permission.decorator';
import { LeadsService } from './leads.service';
import { parseCheckPhoneQuery, parseCreateLead, parseListLeadsQuery, parseUpdateLead } from './leads.validation';

/** S2-09 — Quản lý danh sách lead (Tư vấn tuyển sinh). */
@Controller('leads')
@UseGuards(PermissionGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /** Danh sách lead, mới nhất trước; ?page=&pageSize= (mặc định 20). */
  @Get()
  @RequirePermission(Permission.LEAD_READ)
  list(@Query() query: Record<string, unknown>) {
    return this.leadsService.list(parseListLeadsQuery(query));
  }

  /** Kiểm tra số điện thoại trùng trước khi lưu: ?phone=&excludeId= (excludeId = lead đang sửa). */
  @Get('check-phone')
  @RequirePermission(Permission.LEAD_READ)
  checkPhone(@Query() query: Record<string, unknown>) {
    const { phone, excludeId } = parseCheckPhoneQuery(query);
    return this.leadsService.checkPhone(phone, excludeId);
  }

  @Get(':id')
  @RequirePermission(Permission.LEAD_READ)
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  /** Tạo lead. Trả `{ lead, duplicateWarning }`; trùng số điện thoại vẫn lưu. */
  @Post()
  @RequirePermission(Permission.LEAD_WRITE)
  create(@Body() body: unknown) {
    return this.leadsService.create(parseCreateLead(body));
  }

  /** Sửa một phần các trường. Trả `{ lead, duplicateWarning }`. */
  @Patch(':id')
  @RequirePermission(Permission.LEAD_WRITE)
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.leadsService.update(id, parseUpdateLead(body));
  }

  /** Xoá lead — chỉ Quản lý đào tạo (LEAD_DELETE). */
  @Delete(':id')
  @RequirePermission(Permission.LEAD_DELETE)
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
