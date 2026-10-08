export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Course {
  id: string;
  code: string;
  name: string;
  totalSessions: number;
  weight: number;
  learningOutcomes: string | null;
  programIds: string[];
  status: CourseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseResponse {
  id: string;
  code: string;
  name: string;
  totalSessions: number;
  weight: number;
  learningOutcomes: string | null;
  programIds: string[];
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  code: string;
  name: string;
  totalSessions: number;
  weight: number;
  learningOutcomes?: string | null;
  programIds?: string[];
  status?: CourseStatus;
}

export interface UpdateCourseInput {
  code?: string;
  name?: string;
  totalSessions?: number;
  weight?: number;
  learningOutcomes?: string | null;
  programIds?: string[];
  status?: CourseStatus;
}

export interface ListCoursesQuery {
  page: number;
  pageSize: number;
  q?: string;
  programId?: string;
  status?: CourseStatus;
}
