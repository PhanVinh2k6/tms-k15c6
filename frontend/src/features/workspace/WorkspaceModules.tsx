import { useState } from 'react'
import { BookOpen, Check, ChevronRight, Filter, Pencil, Plus, Search, Send } from 'lucide-react'
import { ROLE_LABEL, type Role } from '../account-lock/types'
import './workspace.css'

export type ModuleKey = 'profile' | 'programs' | 'subjects' | 'sessions' | 'leads' | 'inbox'
type ModuleProps = { module: ModuleKey; role: Role; onNotice: (text: string) => void }

const programs = [
  { code: 'FE-01', name: 'Frontend Engineering', duration: '12 tuần', subjects: 6, status: 'Đang áp dụng', fee: '18.500.000đ' },
  { code: 'BE-01', name: 'Backend & API Engineering', duration: '14 tuần', subjects: 7, status: 'Đang áp dụng', fee: '21.000.000đ' },
  { code: 'PM-01', name: 'Product Operations', duration: '8 tuần', subjects: 4, status: 'Bản nháp', fee: '12.000.000đ' },
]
const subjects = [
  { code: 'S1-01', name: 'Xác thực JWT & Session', lessons: 4, weight: '15%', program: 'BE-01' },
  { code: 'S1-02', name: 'Thiết kế API REST', lessons: 6, weight: '20%', program: 'BE-01' },
  { code: 'S2-01', name: 'React Application', lessons: 8, weight: '25%', program: 'FE-01' },
  { code: 'S2-02', name: 'Testing & Quality', lessons: 5, weight: '15%', program: 'FE-01' },
]
const leads = [
  { name: 'Nguyễn Minh Anh', phone: '0901 222 345', interest: 'Backend & API', source: 'Landing page', status: 'Mới', owner: 'Chưa phân công' },
  { name: 'Trần Quốc Bảo', phone: '0912 888 120', interest: 'Frontend Engineering', source: 'Facebook', status: 'Đang tư vấn', owner: 'Lê Hà' },
  { name: 'Phạm Khánh Linh', phone: '0987 100 220', interest: 'Product Operations', source: 'Giới thiệu', status: 'Đã liên hệ', owner: 'Nguyễn An' },
]

function Header({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="ws-header"><div><p className="ws-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action && <button className="ws-primary" onClick={onAction}><Plus size={16} />{action}</button>}</div>
}

function Profile({ role, onNotice }: ModuleProps) {
  const [saved, setSaved] = useState(false)
  return <><Header eyebrow="S2-02 · PERSONAL PROFILE" title="Hồ sơ cá nhân" description="Cập nhật thông tin liên lạc của bạn. Email và vai trò do quản trị viên quản lý." action="Lưu thay đổi" onAction={() => { setSaved(true); onNotice('Hồ sơ đã được cập nhật an toàn.') }} /><section className="ws-card ws-profile-card"><div className="ws-profile-banner"><div className="ws-big-avatar">{ROLE_LABEL[role].slice(0, 1)}</div><div><h2>Tài khoản demo TMS</h2><p>{ROLE_LABEL[role]} · Đã xác minh</p></div><span className="ws-verified"><Check size={14} /> Đang hoạt động</span></div><div className="ws-form-grid"><label>Họ và tên<input defaultValue={role === 'INSTRUCTOR' ? 'Giảng viên mẫu' : 'Tài khoản demo'} /></label><label>Email<input defaultValue={`${role.toLowerCase()}@tms.local`} disabled /></label><label>Số điện thoại<input defaultValue="0909 123 456" /></label><label>Ngày sinh<input type="date" defaultValue="1998-06-15" /></label><label className="ws-field-wide">Địa chỉ<input defaultValue="Hà Nội, Việt Nam" /></label></div>{saved && <div className="ws-inline-success"><Check size={16} /> Đã lưu thay đổi.</div>}</section></>
}

function Catalog({ mode, onNotice }: { mode: 'programs' | 'subjects'; onNotice: (text: string) => void }) {
  const isProgram = mode === 'programs'
  const [query, setQuery] = useState('')
  const title = isProgram ? 'Chương trình đào tạo' : 'Danh mục môn học'
  const filteredPrograms = programs.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()))
  const filteredSubjects = subjects.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()))
  return <><Header eyebrow={isProgram ? 'S2-04 · TRAINING CATALOG' : 'S2-05 · SUBJECT CATALOG'} title={title} description={isProgram ? 'Khai báo chương trình, thời lượng, học phí và trạng thái áp dụng.' : 'Dùng lại môn học cho nhiều chương trình, theo dõi số buổi và trọng số.'} action={isProgram ? 'Thêm chương trình' : 'Thêm môn học'} onAction={() => onNotice(`Đã mở form tạo ${isProgram ? 'chương trình' : 'môn học'} mới.`)} /><section className="ws-card"><div className="ws-toolbar"><div className="ws-search"><Search size={16} /><input placeholder="Tìm theo mã hoặc tên…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="ws-filter" onClick={() => onNotice('Bộ lọc nâng cao đã sẵn sàng cho Sprint 2.')}><Filter size={15} /> Bộ lọc</button></div><div className="ws-table-wrap"><table className="ws-table"><thead>{isProgram ? <tr><th>Mã</th><th>Chương trình</th><th>Thời lượng</th><th>Môn học</th><th>Học phí chuẩn</th><th>Trạng thái</th></tr> : <tr><th>Mã</th><th>Môn học</th><th>Số buổi</th><th>Trọng số</th><th>Chương trình</th><th /></tr>}</thead><tbody>{isProgram ? filteredPrograms.map((item) => <tr key={item.code}><td><strong>{item.code}</strong></td><td><strong>{item.name}</strong></td><td>{item.duration}</td><td>{item.subjects} môn</td><td>{item.fee}</td><td><span className={`ws-status ${item.status === 'Đang áp dụng' ? 'is-green' : 'is-yellow'}`}>{item.status}</span></td></tr>) : filteredSubjects.map((item) => <tr key={item.code}><td><strong>{item.code}</strong></td><td><strong>{item.name}</strong></td><td>{item.lessons} buổi</td><td>{item.weight}</td><td><span className="ws-tag">{item.program}</span></td><td><button className="ws-row-action" onClick={() => onNotice(`Đang mở chi tiết ${item.name}.`)}><Pencil size={15} /></button></td></tr>)}</tbody></table></div></section></>
}

function Sessions({ onNotice }: { onNotice: (text: string) => void }) {
  return <><Header eyebrow="S2-07 · LESSON PLAN" title="Buổi học & mục tiêu" description="Khai báo nội dung từng buổi để giảng viên và học viên biết đúng lộ trình." action="Thêm buổi học" onAction={() => onNotice('Đã mở form thêm buổi học.')}/><div className="ws-session-grid">{['JWT & Session', 'REST API Design', 'React Application'].map((subject, index) => <section className="ws-card ws-session-card" key={subject}><div className="ws-session-icon"><BookOpen size={19} /></div><div><span>Môn {String(index + 1).padStart(2, '0')}</span><h2>{subject}</h2><p>{index + 4} buổi · {index + 2} mục tiêu</p></div><ChevronRight size={18} /></section>)}</div><section className="ws-card"><div className="ws-section-title"><div><p className="ws-eyebrow">ROADMAP</p><h2>Lộ trình Backend & API Engineering</h2></div><span className="ws-tag">7 môn · 42 buổi</span></div><div className="ws-roadmap">{['Nền tảng web', 'Xác thực JWT & Session', 'Thiết kế API REST', 'Testing & Quality'].map((item, index) => <div key={item}><span>{index + 1}</span><strong>{item}</strong><small>{index < 2 ? 'Đã cấu hình' : 'Chưa bắt đầu'}</small></div>)}</div></section></>
}

function Leads({ mode, onNotice }: { mode: 'leads' | 'inbox'; onNotice: (text: string) => void }) {
  const [status, setStatus] = useState('Tất cả trạng thái')
  const rows = status === 'Tất cả trạng thái' ? leads : leads.filter((lead) => lead.status === status)
  if (mode === 'inbox') return <><Header eyebrow="S2-08 · PUBLIC LEAD FORM" title="Đăng ký tư vấn" description="Form public dành cho khách truy cập. Không cần đăng nhập và sẵn sàng kết nối landing page." /><section className="ws-card ws-lead-form"><div className="ws-lead-visual"><div className="ws-lead-orb"><Send size={28} /></div><h2>Học đúng lộ trình, đi nhanh hơn.</h2><p>Để lại thông tin, đội ngũ tư vấn sẽ gọi lại trong 15 phút.</p></div><div className="ws-form-grid"><label>Họ và tên<input placeholder="Nguyễn Văn A" /></label><label>Số điện thoại<input placeholder="09xx xxx xxx" /></label><label>Email<input placeholder="you@example.com" /></label><label>Chương trình quan tâm<select><option>Chọn chương trình</option><option>Backend & API Engineering</option><option>Frontend Engineering</option></select></label><label className="ws-field-wide">Ghi chú<textarea placeholder="Bạn muốn được tư vấn điều gì?" /></label><button className="ws-primary ws-field-wide" onClick={() => onNotice('Đã gửi lead demo. Hệ thống sẽ tạo lead ở trạng thái Mới.') }><Send size={15} /> Gửi thông tin tư vấn</button></div></section></>
  return <><Header eyebrow="S2-09–11 · LEAD PIPELINE" title="Danh sách khách hàng tiềm năng" description="Tìm kiếm, lọc và phân công lead để không bỏ sót cuộc gọi." action="Tạo lead" onAction={() => onNotice('Đã mở form tạo lead mới.')}/><section className="ws-card"><div className="ws-toolbar"><div className="ws-search"><Search size={16} /><input placeholder="Tìm theo tên hoặc số điện thoại…" /></div><select className="ws-select" value={status} onChange={(e) => setStatus(e.target.value)}><option>Tất cả trạng thái</option><option>Mới</option><option>Đã liên hệ</option><option>Đang tư vấn</option></select></div><div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Khách hàng</th><th>Chương trình quan tâm</th><th>Nguồn</th><th>Trạng thái</th><th>Người phụ trách</th><th /></tr></thead><tbody>{rows.map((lead) => <tr key={lead.phone}><td><strong>{lead.name}</strong><small className="ws-cell-sub">{lead.phone}</small></td><td>{lead.interest}</td><td>{lead.source}</td><td><span className={`ws-status ${lead.status === 'Mới' ? 'is-purple' : 'is-green'}`}>{lead.status}</span></td><td>{lead.owner}</td><td><button className="ws-row-action" onClick={() => onNotice(`Đã mở lead của ${lead.name}.`)}><ChevronRight size={16} /></button></td></tr>)}</tbody></table></div></section></>
}

export function WorkspaceModule({ module, role, onNotice }: ModuleProps) {
  if (module === 'profile') return <Profile module={module} role={role} onNotice={onNotice} />
  if (module === 'programs') return <Catalog mode="programs" onNotice={onNotice} />
  if (module === 'subjects') return <Catalog mode="subjects" onNotice={onNotice} />
  if (module === 'sessions') return <Sessions onNotice={onNotice} />
  return <Leads mode={module} onNotice={onNotice} />
}
