export enum ProgramStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Program {
  id: string;
  code: string;
  name: string;
  description: string | null;
  totalDuration: number;
  standardTuition: number;
  status: ProgramStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgramResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  totalDuration: number;
  standardTuition: number;
  status: ProgramStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramInput {
  code: string;
  name: string;
  description?: string | null;
  totalDuration: number;
  standardTuition: number;
  status?: ProgramStatus;
}

export interface UpdateProgramInput {
  code?: string;
  name?: string;
  description?: string | null;
  totalDuration?: number;
  standardTuition?: number;
  status?: ProgramStatus;
}

export interface ListProgramsQuery {
  page: number;
  pageSize: number;
  q?: string;
  status?: ProgramStatus;
}