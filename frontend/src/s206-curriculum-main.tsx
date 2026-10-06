import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CurriculumCoursePlanner } from './features/curriculum-course-planner'
import { mockCurriculumApi } from './features/curriculum-course-planner/mockApi'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurriculumCoursePlanner api={mockCurriculumApi} programId="demo-program" programName="Cử nhân Công nghệ thông tin" />
  </StrictMode>,
)
