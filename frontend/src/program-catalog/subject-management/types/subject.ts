export interface Subject {
  id: string;
  code: string;
  name: string;
  numberOfSessions: number;
  weight: number;
  learningOutcomes: string;
  hasClasses: boolean;
  programIds: string[];
}

export type SubjectInput = Omit<Subject, "id" | "hasClasses" | "programIds">;
