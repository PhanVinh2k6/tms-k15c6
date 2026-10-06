import type { Course, CurriculumCourse, CurriculumCoursePlannerApi } from './types'

type ApiErrorPayload = { message?: string }

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    let message = `Yêu cầu thất bại (${response.status})`
    try {
      const payload = await response.json() as ApiErrorPayload
      if (payload.message) message = payload.message
    } catch {
      // Giữ thông báo HTTP mặc định nếu response không phải JSON.
    }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function createCurriculumCoursePlannerApi(baseUrl = '/api') : CurriculumCoursePlannerApi {
  return {
    listCoursesInProgram: (programId, signal) => request<CurriculumCourse[]>(`${baseUrl}/programs/${programId}/courses`, { signal }),
    listAvailableCourses: (programId, signal) => request<Course[]>(`${baseUrl}/programs/${programId}/available-courses`, { signal }),
    addCourseToProgram: (programId, courseId) => request<CurriculumCourse>(`${baseUrl}/programs/${programId}/courses`, {
      method: 'POST', body: JSON.stringify({ courseId }),
    }),
    removeCourseFromProgram: (programId, courseId) => request<void>(`${baseUrl}/programs/${programId}/courses/${courseId}`, { method: 'DELETE' }),
    updateCourseOrder: (programId, courseIds) => request<CurriculumCourse[]>(`${baseUrl}/programs/${programId}/courses/order`, {
      method: 'PUT', body: JSON.stringify({ courseIds }),
    }),
    updatePrerequisites: (programId, courseId, prerequisiteIds) => request<CurriculumCourse>(`${baseUrl}/programs/${programId}/courses/${courseId}/prerequisites`, {
      method: 'PUT', body: JSON.stringify({ prerequisiteIds }),
    }),
  }
}
