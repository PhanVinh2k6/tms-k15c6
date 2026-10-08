import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { ProgramStatus } from './program.types';

export const PROGRAM_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

export class CreateProgramDto {
  @IsString()
  @MinLength(2, { message: 'Mã chương trình phải từ 2 đến 50 ký tự.' })
  @MaxLength(50, { message: 'Mã chương trình tối đa 50 ký tự.' })
  @Matches(PROGRAM_CODE_REGEX, {
    message: 'Mã chương trình chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) hoặc gạch dưới (_).',
  })
  code!: string;

  @IsString()
  @MinLength(2, { message: 'Tên chương trình phải từ 2 đến 200 ký tự.' })
  @MaxLength(200, { message: 'Tên chương trình tối đa 200 ký tự.' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Mô tả chương trình tối đa 2000 ký tự.' })
  description?: string;

  @IsInt({ message: 'Tổng thời lượng phải là số nguyên.' })
  @IsPositive({ message: 'Tổng thời lượng phải lớn hơn 0.' })
  totalDuration!: number;

  @IsNumber({}, { message: 'Học phí chuẩn phải là một số.' })
  @Min(0, { message: 'Học phí chuẩn phải lớn hơn hoặc bằng 0.' })
  standardTuition!: number;

  @IsOptional()
  @IsEnum(ProgramStatus, { message: 'Trạng thái chương trình không hợp lệ.' })
  status?: ProgramStatus;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Mã chương trình phải từ 2 đến 50 ký tự.' })
  @MaxLength(50, { message: 'Mã chương trình tối đa 50 ký tự.' })
  @Matches(PROGRAM_CODE_REGEX, {
    message: 'Mã chương trình chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) hoặc gạch dưới (_).',
  })
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên chương trình phải từ 2 đến 200 ký tự.' })
  @MaxLength(200, { message: 'Tên chương trình tối đa 200 ký tự.' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Mô tả chương trình tối đa 2000 ký tự.' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Tổng thời lượng phải là số nguyên.' })
  @IsPositive({ message: 'Tổng thời lượng phải lớn hơn 0.' })
  totalDuration?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Học phí chuẩn phải là một số.' })
  @Min(0, { message: 'Học phí chuẩn phải lớn hơn hoặc bằng 0.' })
  standardTuition?: number;

  @IsOptional()
  @IsEnum(ProgramStatus, { message: 'Trạng thái chương trình không hợp lệ.' })
  status?: ProgramStatus;
}