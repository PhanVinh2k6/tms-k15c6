import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CourseStatus } from './course.types';

export const COURSE_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

export class CreateCourseDto {
  @IsString()
  @MinLength(2, { message: 'Mã môn học phải từ 2 đến 50 ký tự.' })
  @MaxLength(50, { message: 'Mã môn học tối đa 50 ký tự.' })
  @Matches(COURSE_CODE_REGEX, {
    message: 'Mã môn học chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) hoặc gạch dưới (_).',
  })
  code!: string;

  @IsString()
  @MinLength(2, { message: 'Tên môn học phải từ 2 đến 200 ký tự.' })
  @MaxLength(200, { message: 'Tên môn học tối đa 200 ký tự.' })
  name!: string;

  @IsInt({ message: 'Số buổi phải là số nguyên.' })
  @IsPositive({ message: 'Số buổi phải lớn hơn 0.' })
  totalSessions!: number;

  @IsNumber({}, { message: 'Trọng số phải là một số.' })
  @IsPositive({ message: 'Trọng số phải lớn hơn 0.' })
  weight!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3000, { message: 'Mô tả chuẩn đầu ra tối đa 3000 ký tự.' })
  learningOutcomes?: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách chương trình phải là một mảng.' })
  @IsString({ each: true, message: 'Mỗi mã chương trình phải là chuỗi.' })
  programIds?: string[];

  @IsOptional()
  @IsEnum(CourseStatus, { message: 'Trạng thái môn học không hợp lệ.' })
  status?: CourseStatus;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Mã môn học phải từ 2 đến 50 ký tự.' })
  @MaxLength(50, { message: 'Mã môn học tối đa 50 ký tự.' })
  @Matches(COURSE_CODE_REGEX, {
    message: 'Mã môn học chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) hoặc gạch dưới (_).',
  })
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên môn học phải từ 2 đến 200 ký tự.' })
  @MaxLength(200, { message: 'Tên môn học tối đa 200 ký tự.' })
  name?: string;

  @IsOptional()
  @IsInt({ message: 'Số buổi phải là số nguyên.' })
  @IsPositive({ message: 'Số buổi phải lớn hơn 0.' })
  totalSessions?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Trọng số phải là một số.' })
  @IsPositive({ message: 'Trọng số phải lớn hơn 0.' })
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3000, { message: 'Mô tả chuẩn đầu ra tối đa 3000 ký tự.' })
  learningOutcomes?: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách chương trình phải là một mảng.' })
  @IsString({ each: true, message: 'Mỗi mã chương trình phải là chuỗi.' })
  programIds?: string[];

  @IsOptional()
  @IsEnum(CourseStatus, { message: 'Trạng thái môn học không hợp lệ.' })
  status?: CourseStatus;
}
