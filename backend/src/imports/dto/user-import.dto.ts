import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UserImportRowDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}

export class UserImportPreviewDto {
  validRows: UserImportRowDto[];
  invalidRows: Array<{
    rowIndex: number;
    data: any;
    errors: string[];
  }>;
  totalRows: number;
  validCount: number;
  invalidCount: number;
}

export class UserImportResultDto {
  imported: number;
  failed: number;
  total: number;
  failedRows: Array<{
    rowIndex: number;
    email: string;
    reason: string;
  }>;
}