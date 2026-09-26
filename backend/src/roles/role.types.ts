export enum Role {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  TRAINING_MANAGER = 'TRAINING_MANAGER',
  ADMISSIONS = 'ADMISSIONS',
  ACCOUNTANT = 'ACCOUNTANT',
  TA = 'TA',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  email: string;
  roles: Set<Role>;
}

export interface Actor {
  id: string;
  roles: Set<Role>;
}
