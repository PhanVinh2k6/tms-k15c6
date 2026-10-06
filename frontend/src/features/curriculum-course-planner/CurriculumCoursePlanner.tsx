import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react'
import type { Course, CurriculumCourse, CurriculumCoursePlannerApi, CurriculumCoursePlannerProps } from './types'
import './curriculum-course-planner.css'

function orderCourses(courses: CurriculumCourse[]) {
  return courses.map((course, index) => ({ ...course, order: index + 1 }))
}

export default function CurriculumCoursePlanner({ programId, programName, api }: CurriculumCoursePlannerProps) {
  const [courses, setCourses] = useState<CurriculumCourse[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isPrerequisiteOpen, setIsPrerequisiteOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [orderDirty, setOrderDirty] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null)
  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null)

  async function loadData(signal?: AbortSignal) {
    setLoading(true)
    setError('')
    try {
      const [programCourses, catalogCourses] = await Promise.all([
        api.listCoursesInProgram(programId, signal),
        api.listAvailableCourses(programId, signal),
      ])
      setCourses(orderCourses(programCourses))
      setAvailableCourses(catalogCourses)
      setOrderDirty(false)
    } catch (caught) {
      if ((caught as Error).name !== 'AbortError') setError((caught as Error).message || 'Không tải được dữ liệu lộ trình.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadData(controller.signal)
    return () => controller.abort()
  }, [api, programId])

  const selectedCourse = courses.find((course) => course.id === selectedCourseId)
  const prerequisiteOptions = courses.filter((course) => course.id !== selectedCourseId)
  const filteredAvailable = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    const selectedIds = new Set(courses.map((course) => course.id))
    return availableCourses.filter((course) => !selectedIds.has(course.id) && `${course.code} ${course.name}`.toLocaleLowerCase('vi').includes(normalized))
  }, [availableCourses, courses, query])
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)

  function showError(caught: unknown, fallback: string) {
    setNotice('')
    setError(caught instanceof Error ? caught.message : fallback)
  }

  function moveCourse(from: number, to: number) {
    if (to < 0 || to >= courses.length) return
    const next = [...courses]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setCourses(orderCourses(next))
    setOrderDirty(true)
    setNotice('')
  }

  async function saveOrder() {
    setSavingOrder(true)
    setError('')
    try {
      const savedCourses = await api.updateCourseOrder(programId, courses.map((course) => course.id))
      setCourses(orderCourses(savedCourses))
      setOrderDirty(false)
      setNotice('Đã lưu thứ tự môn học.')
    } catch (caught) {
      showError(caught, 'Không lưu được thứ tự môn học.')
    } finally {
      setSavingOrder(false)
    }
  }

  async function addCourse(course: Course) {
    setSavingCourseId(course.id)
    setError('')
    try {
      const added = await api.addCourseToProgram(programId, course.id)
      setCourses((current) => [...current, { ...added, order: current.length + 1 }])
      setAvailableCourses((current) => current.filter((item) => item.id !== course.id))
      setNotice(`Đã thêm ${course.code} vào chương trình.`)
      setIsPickerOpen(false)
      setQuery('')
    } catch (caught) {
      showError(caught, 'Không thêm được môn học.')
    } finally {
      setSavingCourseId(null)
    }
  }

  async function removeCourse(course: CurriculumCourse) {
    if (!window.confirm(`Gỡ ${course.code} — ${course.name} khỏi chương trình?`)) return
    setRemovingCourseId(course.id)
    setError('')
    try {
      await api.removeCourseFromProgram(programId, course.id)
      setCourses((current) => orderCourses(current.filter((item) => item.id !== course.id).map((item) => ({ ...item, prerequisites: item.prerequisites.filter((id) => id !== course.id) }))))
      setAvailableCourses((current) => [...current, course])
      setNotice(`Đã gỡ ${course.code} khỏi chương trình.`)
    } catch (caught) {
      showError(caught, 'Không gỡ được môn học.')
    } finally {
      setRemovingCourseId(null)
    }
  }

  async function togglePrerequisite(prerequisiteId: string) {
    if (!selectedCourse) return
    const nextPrerequisites = selectedCourse.prerequisites.includes(prerequisiteId)
      ? selectedCourse.prerequisites.filter((id) => id !== prerequisiteId)
      : [...selectedCourse.prerequisites, prerequisiteId]
    setSavingCourseId(selectedCourse.id)
    setError('')
    try {
      const savedCourse = await api.updatePrerequisites(programId, selectedCourse.id, nextPrerequisites)
      setCourses((current) => current.map((course) => course.id === savedCourse.id ? savedCourse : course))
      setNotice(`Đã lưu môn tiên quyết cho ${selectedCourse.code}.`)
    } catch (caught) {
      showError(caught, 'Không lưu được môn tiên quyết.')
    } finally {
      setSavingCourseId(null)
    }
  }

  return (
    <main className="curriculum-planner" aria-labelledby="s206-title">
      <header className="planner-header">
        <div><p className="planner-eyebrow">S2-06 · QUẢN LÝ ĐÀO TẠO</p><h1 id="s206-title">Gắn môn học & sắp xếp lộ trình</h1><p className="planner-description">{programName}</p></div>
        <div className="planner-header-actions"><button className="secondary-button" type="button" onClick={() => void loadData()}><RefreshCw size={16} /> Tải lại</button><button className="save-button" type="button" disabled={!orderDirty || savingOrder} onClick={() => void saveOrder()}><Save size={16} /> {savingOrder ? 'Đang lưu...' : 'Lưu thứ tự'}</button></div>
      </header>
      <div className="program-summary" aria-label="Thống kê chương trình"><div className="program-stat"><small>Số môn</small><strong>{courses.length}</strong></div><div className="program-stat"><small>Tổng tín chỉ</small><strong>{totalCredits}</strong></div></div>
      {error && <div className="feedback feedback-error" role="alert"><strong>Chưa lưu được thay đổi.</strong><span>{error}</span><button type="button" onClick={() => void loadData()}>Thử lại</button></div>}
      {notice && <div className="feedback feedback-success" role="status">{notice}</div>}
      {loading ? <div className="state-card" role="status">Đang tải danh sách môn học...</div> : <section className="course-list-panel" aria-labelledby="course-list-title"><div className="panel-heading"><div><h2 id="course-list-title">Môn học trong chương trình</h2><p>Kéo thả hoặc dùng nút mũi tên để thay đổi thứ tự.</p></div><span className="course-count">{courses.length} môn</span></div>{courses.length === 0 ? <div className="state-card">Chưa có môn học trong chương trình.</div> : <div className="course-list">{courses.map((course, index) => <article className={`course-row${draggedId === course.id ? ' is-dragging' : ''}`} key={course.id} draggable onDragStart={() => setDraggedId(course.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) moveCourse(courses.findIndex((item) => item.id === draggedId), index); setDraggedId(null) }} onDragEnd={() => setDraggedId(null)}><button className="drag-handle" type="button" aria-label={`Kéo ${course.code} để sắp xếp`}><GripVertical size={18} /></button><span className="order-number">{String(index + 1).padStart(2, '0')}</span><div className="course-main"><span className="course-code">{course.code}</span><h3>{course.name}</h3><small>{course.credits} tín chỉ{course.department ? ` · ${course.department}` : ''}</small></div><div className="row-actions"><div className="move-buttons"><button type="button" aria-label={`Đưa ${course.code} lên`} disabled={index === 0} onClick={() => moveCourse(index, index - 1)}><ArrowUp size={14} /></button><button type="button" aria-label={`Đưa ${course.code} xuống`} disabled={index === courses.length - 1} onClick={() => moveCourse(index, index + 1)}><ArrowDown size={14} /></button></div><button className="prerequisite-button" type="button" onClick={() => { setSelectedCourseId(course.id); setIsPrerequisiteOpen(true) }}>{course.prerequisites.length ? `${course.prerequisites.length} tiên quyết` : 'Tiên quyết'}</button><button className="remove-button" type="button" disabled={removingCourseId === course.id} aria-label={`Gỡ ${course.code}`} onClick={() => void removeCourse(course)}><Trash2 size={16} /></button></div></article>)}</div>}<button className="add-course-button" type="button" onClick={() => setIsPickerOpen(true)}><Plus size={18} /> Thêm môn học</button></section>}
      {isPickerOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsPickerOpen(false)}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="picker-title" onMouseDown={(event) => event.stopPropagation()}><div className="picker-header"><div><p className="planner-eyebrow">DANH MỤC MÔN HỌC</p><h2 id="picker-title">Thêm môn vào chương trình</h2></div><button className="close-button" type="button" aria-label="Đóng" onClick={() => setIsPickerOpen(false)}><X size={19} /></button></div><label className="search-box"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã hoặc tên môn" /></label><div className="available-list">{filteredAvailable.length === 0 ? <p className="no-results">Không còn môn phù hợp để thêm.</p> : filteredAvailable.map((course) => <button className="available-course" type="button" key={course.id} disabled={savingCourseId === course.id} onClick={() => void addCourse(course)}><span><strong>{course.code}</strong><b>{course.name}</b><small>{course.credits} tín chỉ</small></span><Plus size={18} /></button>)}</div></section></div>}
      {isPrerequisiteOpen && selectedCourse && <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsPrerequisiteOpen(false)}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="prerequisite-title" onMouseDown={(event) => event.stopPropagation()}><div className="picker-header"><div><p className="planner-eyebrow">MÔN TIÊN QUYẾT</p><h2 id="prerequisite-title">{selectedCourse.code} — Môn học trước</h2></div><button className="close-button" type="button" aria-label="Đóng" onClick={() => setIsPrerequisiteOpen(false)}><X size={19} /></button></div><p className="modal-description">Chọn các môn phải hoàn thành trước khi học môn này. Thay đổi được lưu ngay.</p><div className="prerequisite-options">{prerequisiteOptions.map((course) => <label className="prerequisite-option" key={course.id}><input type="checkbox" checked={selectedCourse.prerequisites.includes(course.id)} disabled={savingCourseId === selectedCourse.id} onChange={() => void togglePrerequisite(course.id)} /><span className="fake-checkbox" /><span><strong>{course.code}</strong> {course.name}</span></label>)}</div></section></div>}
    </main>
  )
}

export type { CurriculumCoursePlannerApi }
