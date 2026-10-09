import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Get,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UserImportService } from '../services/user-import.service';
import { PermissionGuard } from '../../roles/guards/permission.guard';
import { RequirePermission } from '../../roles/decorators/require-permission.decorator';
import { Permission } from '../../roles/types/permission.enum';

@Controller('imports')
@UseGuards(PermissionGuard)
export class UserImportController {
  constructor(private userImportService: UserImportService) {}

  @Get('users/template')
  @RequirePermission(Permission.USER_WRITE)
  async downloadTemplate(@Res() res: Response) {
    const buffer = this.userImportService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="user-template.xlsx"');
    res.send(buffer);
  }

  @Post('users/preview')
  @RequirePermission(Permission.USER_WRITE)
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File not provided');
    }
    if (!file.mimetype.includes('spreadsheetml') && !file.mimetype.includes('sheet')) {
      throw new BadRequestException('Only Excel files are accepted');
    }
    return this.userImportService.previewImport(file);
  }

  @Post('users/import')
  @RequirePermission(Permission.USER_WRITE)
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File not provided');
    }
    if (!file.mimetype.includes('spreadsheetml') && !file.mimetype.includes('sheet')) {
      throw new BadRequestException('Only Excel files are accepted');
    }
    return this.userImportService.importUsers(file);
  }
}