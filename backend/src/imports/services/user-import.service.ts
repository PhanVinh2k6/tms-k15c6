import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import 'multer';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  UserImportRowDto,
  UserImportPreviewDto,
  UserImportResultDto,
} from '../dto/user-import.dto';
import { UsersService } from '../../users/users.service';
import { Role } from '../../roles/role.types';

@Injectable()
export class UserImportService {
  constructor(private usersService: UsersService) {}

  async previewImport(file: Express.Multer.File): Promise<UserImportPreviewDto> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const validRows: UserImportRowDto[] = [];
    const invalidRows: Array<{
      rowIndex: number;
      data: Record<string, unknown>;
      errors: string[];
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];

      const dto = plainToInstance(UserImportRowDto, rowData, {
        enableImplicitConversion: true,
      });

      const errors = await validate(dto, { skipMissingProperties: false });

      if (errors.length > 0) {
        invalidRows.push({
          rowIndex: i + 1,
          data: rowData,
          errors: errors.map((err) =>
            Object.values(err.constraints || {}).join('; '),
          ),
        });
      } else {
        validRows.push(dto);
      }
    }

    return {
      validRows,
      invalidRows,
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
    };
  }

  async importUsers(file: Express.Multer.File): Promise<UserImportResultDto> {
    const preview = await this.previewImport(file);

    const result: UserImportResultDto = {
      imported: 0,
      failed: 0,
      total: preview.totalRows,
      failedRows: [],
    };

    for (const row of preview.validRows) {
      try {
        await this.usersService.create({
          fullName: row.fullName,
          email: row.email,
          phone: row.phone ?? undefined,
          roles: [row.role as Role],
        });
        result.imported++;
      } catch (error) {
        result.failed++;
        result.failedRows.push({
          rowIndex: preview.invalidRows.length + result.imported + 1,
          email: row.email,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    for (const invalidRow of preview.invalidRows) {
      result.failedRows.push({
        rowIndex: invalidRow.rowIndex,
        email: typeof invalidRow.data.email === 'string' ? invalidRow.data.email : 'N/A',
        reason: invalidRow.errors.join('; '),
      });
    }

    return result;
  }

  generateTemplate(): Buffer {
    const data = [
      {
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@tms.local',
        phone: '0901234567',
        role: 'STUDENT',
      },
      {
        fullName: 'Trần Thị B',
        email: 'tranthib@tms.local',
        phone: '0912345678',
        role: 'INSTRUCTOR',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}