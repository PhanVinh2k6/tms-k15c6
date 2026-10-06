import type { Course, CurriculumCourse, CurriculumCoursePlannerApi } from './types'

const catalog: Course[] = [
  { id: 'it101', code: 'IT101', name: 'Nhập môn Công nghệ thông tin', credits: 3, department: 'Cơ sở ngành' },
  { id: 'it201', code: 'IT201', name: 'Lập trình cơ bản', credits: 3, department: 'Cơ sở ngành' },
  { id: 'it301', code: 'IT301', name: 'Cơ sở dữ liệu', credits: 3, department: 'Chuyên ngành' },
  { id: 'it302', code: 'IT302', name: 'Phát triển ứng dụng web', credits: 3, department: 'Chuyên ngành' },
  { id: 'it401', code: 'IT401', name: 'Đồ án tốt nghiệp', credits: 6, department: 'Tốt nghiệp' },
]

let selected: CurriculumCourse[] = [
  { ...catalog[0], order: 1, prerequisites: [] },
  { ...catalog[1], order: 2, prerequisites: ['it101'] },
  { ...catalog[2], order: 3, prerequisites: ['it201'] },
]

const wait = () => new Promise((resolve) => setTimeout(resolve, 250))
const clone = <T,>(value: T): T => structuredClone(value)

export const mockCurriculumApi: CurriculumCoursePlannerApi = {
  async listCoursesInProgram() { await wait(); return clone(selected) },
  async listAvailableCourses() { await wait(); return clone(catalog.filter((course) => !selected.some((item) => item.id === course.id))) },
  async addCourseToProgram(_programId, courseId) { await wait(); const course = catalog.find((item) => item.id === courseId); if (!course) throw new Error('Không tìm thấy môn học.'); const added = { ...course, order: selected.length + 1, prerequisites: [] }; selected = [...selected, added]; return clone(added) },
  async removeCourseFromProgram(_programId, courseId) { await wait(); selected = selected.filter((course) => course.id !== courseId).map((course, index) => ({ ...course, order: index + 1, prerequisites: course.prerequisites.filter((id) => id !== courseId) })) },
  async updateCourseOrder(_programId, courseIds) { await wait(); selected = courseIds.map((id, index) => ({ ...selected.find((course) => course.id === id)!, order: index + 1 })); return clone(selected) },
  async updatePrerequisites(_programId, courseId, prerequisiteIds) { await wait(); selected = selected.map((course) => course.id === courseId ? { ...course, prerequisites: prerequisiteIds } : course); return clone(selected.find((course) => course.id === courseId)!) },
}
