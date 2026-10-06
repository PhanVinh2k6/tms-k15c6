export type Course = {
  id: string
  code: string
  name: string
  credits: number
  department?: string
}

export type CurriculumCourse = Course & {
  order: number
  prerequisites: string[]
}

export type CurriculumCoursePlannerApi = {
  listCoursesInProgram: (programId: string, signal?: AbortSignal) => Promise<CurriculumCourse[]>
  listAvailableCourses: (programId: string, signal?: AbortSignal) => Promise<Course[]>
  addCourseToProgram: (programId: string, courseId: string) => Promise<CurriculumCourse>
  removeCourseFromProgram: (programId: string, courseId: string) => Promise<void>
  updateCourseOrder: (programId: string, courseIds: string[]) => Promise<CurriculumCourse[]>
  updatePrerequisites: (programId: string, courseId: string, prerequisiteIds: string[]) => Promise<CurriculumCourse>
}

export type CurriculumCoursePlannerProps = {
  programId: string
  programName: string
  api: CurriculumCoursePlannerApi
}
