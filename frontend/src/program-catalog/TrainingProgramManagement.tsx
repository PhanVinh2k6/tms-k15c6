import { useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

type TrainingProgramStatus = "ACTIVE" | "INACTIVE";

type TrainingProgram = {
  id: string;
  code: string;
  name: string;
  description: string;
  totalDuration: number;
  standardTuition: number;
  status: TrainingProgramStatus;
  hasRunningClasses: boolean;
};

type TrainingProgramForm = Omit<TrainingProgram, "id" | "hasRunningClasses">;
type TrainingProgramStatusFilter = "ALL" | TrainingProgramStatus;

const initialTrainingPrograms: TrainingProgram[] = [
  {
    id: "program-1",
    code: "CT-DA-001",
    name: "Phân tích dữ liệu thực chiến",
    description: "Chương trình nền tảng về phân tích và trực quan hóa dữ liệu.",
    totalDuration: 24,
    standardTuition: 12500000,
    status: "ACTIVE",
    hasRunningClasses: true,
  },
  {
    id: "program-2",
    code: "CT-QT-002",
    name: "Kỹ năng quản lý dành cho cấp trung",
    description: "Phát triển năng lực quản lý và dẫn dắt đội nhóm.",
    totalDuration: 16,
    standardTuition: 9800000,
    status: "ACTIVE",
    hasRunningClasses: true,
  },
  {
    id: "program-3",
    code: "CT-BH-003",
    name: "Bán hàng chuyên nghiệp",
    description: "Kỹ năng tư vấn, bán hàng và chăm sóc khách hàng.",
    totalDuration: 12,
    standardTuition: 7200000,
    status: "ACTIVE",
    hasRunningClasses: false,
  },
  {
    id: "program-4",
    code: "CT-NS-004",
    name: "Hội nhập nhân sự mới",
    description: "Kiến thức và kỹ năng dành cho nhân sự mới gia nhập.",
    totalDuration: 8,
    standardTuition: 4500000,
    status: "ACTIVE",
    hasRunningClasses: false,
  },
  {
    id: "program-5",
    code: "CT-KN-005",
    name: "Giao tiếp và làm việc nhóm",
    description: "Thực hành giao tiếp hiệu quả và phối hợp trong công việc.",
    totalDuration: 10,
    standardTuition: 5900000,
    status: "INACTIVE",
    hasRunningClasses: false,
  },
  {
    id: "program-6",
    code: "CT-AT-006",
    name: "An toàn lao động cơ bản",
    description: "Các nguyên tắc an toàn cần thiết tại nơi làm việc.",
    totalDuration: 6,
    standardTuition: 3200000,
    status: "INACTIVE",
    hasRunningClasses: false,
  },
];

const emptyTrainingProgramForm: TrainingProgramForm = {
  code: "",
  name: "",
  description: "",
  totalDuration: 1,
  standardTuition: 0,
  status: "ACTIVE",
};

const trainingProgramColors = {
  purple: "#6846d6",
  purpleDark: "#5635bd",
  purplePale: "#f2edff",
  ink: "#28243b",
  muted: "#88849b",
  border: "#e9e6f1",
  background: "#f8f7fc",
  green: "#2fae8e",
  red: "#d65a69",
};

const formatTrainingProgramCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

function TrainingProgramIcon({
  name,
  size = 18,
}: {
  name: "grid" | "book" | "users" | "chart" | "search" | "plus" | "edit" | "trash" | "close" | "help";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    book: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 0 5 22z" /><path d="M5 4.5v15A2.5 2.5 0 0 1 7.5 17H20" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" /><path d="M10 11v5m4-5v5" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    help: <><circle cx="12" cy="12" r="10" /><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1 .9-1.8 1.2-1.8 2.7M12 17h.01" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

const trainingProgramBaseButton: CSSProperties = {
  border: 0,
  borderRadius: 9,
  cursor: "pointer",
  font: "inherit",
  transition: "background 140ms ease, box-shadow 140ms ease",
};

const trainingProgramFieldStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${trainingProgramColors.border}`,
  borderRadius: 8,
  padding: "11px 12px",
  color: trainingProgramColors.ink,
  background: "#fff",
  font: "inherit",
  outlineColor: trainingProgramColors.purple,
};

const colors = trainingProgramColors;
const formatCurrency = formatTrainingProgramCurrency;
const Icon = TrainingProgramIcon;
const baseButton = trainingProgramBaseButton;
const fieldStyle = trainingProgramFieldStyle;

export function TrainingProgramManagement() {
  const [programs, setPrograms] = useState<TrainingProgram[]>(initialTrainingPrograms);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrainingProgramStatusFilter>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [form, setForm] = useState<TrainingProgramForm>(emptyTrainingProgramForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<{
    id: string;
    action: "deactivate" | "delete";
  } | null>(null);

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return programs.filter((program) => {
      const matchesSearch =
        query.length === 0 ||
        program.code.toLocaleLowerCase("vi").includes(query) ||
        program.name.toLocaleLowerCase("vi").includes(query);
      return (
        matchesSearch &&
        (statusFilter === "ALL" || program.status === statusFilter)
      );
    });
  }, [programs, search, statusFilter]);

  const activeCount = programs.filter((program) => program.status === "ACTIVE").length;
  const inactiveCount = programs.filter((program) => program.status === "INACTIVE").length;

  const openCreateForm = () => {
    setEditingProgram(null);
    setForm(emptyTrainingProgramForm);
    setErrors({});
    setFormOpen(true);
  };

  const openEditForm = (program: TrainingProgram) => {
    setEditingProgram(program);
    setForm({
      code: program.code,
      name: program.name,
      description: program.description,
      totalDuration: program.totalDuration,
      standardTuition: program.standardTuition,
      status: program.status,
    });
    setErrors({});
    setFormOpen(true);
  };

  const saveProgram = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const normalizedCode = form.code.trim().toLocaleUpperCase("vi");
    if (!normalizedCode) nextErrors.code = "Vui lòng nhập mã chương trình.";
    if (
      normalizedCode &&
      programs.some(
        (program) =>
          program.code.toLocaleUpperCase("vi") === normalizedCode &&
          program.id !== editingProgram?.id,
      )
    ) {
      nextErrors.code = "Mã chương trình này đã tồn tại.";
    }
    if (!form.name.trim()) nextErrors.name = "Vui lòng nhập tên chương trình.";
    if (!Number.isFinite(form.totalDuration) || form.totalDuration <= 0) {
      nextErrors.totalDuration = "Tổng thời lượng phải là số dương.";
    }
    if (!Number.isFinite(form.standardTuition) || form.standardTuition < 0) {
      nextErrors.standardTuition = "Học phí chuẩn phải là số không âm.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const updatedFields = {
      ...form,
      code: normalizedCode,
      name: form.name.trim(),
      description: form.description.trim(),
    };
    if (editingProgram) {
      setPrograms((current) =>
        current.map((program) =>
          program.id === editingProgram.id
            ? { ...program, ...updatedFields }
            : program,
        ),
      );
    } else {
      setPrograms((current) => [
        ...current,
        {
          ...updatedFields,
          id: `program-${Date.now()}`,
          hasRunningClasses: false,
        },
      ]);
    }
    setFormOpen(false);
  };

  const confirmAction = () => {
    if (!confirming) return;
    if (confirming.action === "deactivate") {
      setPrograms((current) =>
        current.map((program) =>
          program.id === confirming.id
            ? { ...program, status: "INACTIVE" }
            : program,
        ),
      );
    } else {
      setPrograms((current) =>
        current.filter((program) => program.id !== confirming.id),
      );
    }
    setConfirming(null);
  };

  const targetProgram = confirming
    ? programs.find((program) => program.id === confirming.id)
    : undefined;

  const navItems = [
    { icon: "grid" as const, label: "Tổng quan" },
    { icon: "book" as const, label: "Khóa học" },
    { icon: "book" as const, label: "Lớp học" },
    { icon: "users" as const, label: "Học viên" },
    { icon: "chart" as const, label: "Báo cáo" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: colors.background,
        color: colors.ink,
        fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
        fontSize: 14,
      }}
    >
      <aside
        style={{
          width: 226,
          flex: "0 0 226px",
          background: "linear-gradient(180deg, #6846d6 0%, #4f32b3 100%)",
          color: "#fff",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 5px 26px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "#fff", color: colors.purple, display: "grid", placeItems: "center", fontWeight: 800 }}>e</div>
          <div>
            <div style={{ fontWeight: 750, letterSpacing: ".2px" }}>eduflow.</div>
            <div style={{ fontSize: 9, letterSpacing: 1.4, opacity: 0.7, marginTop: 3 }}>TRAINING PLATFORM</div>
          </div>
        </div>
        <div style={{ color: "#c6b9ff", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "0 7px 10px" }}>KHÔNG GIAN LÀM VIỆC</div>
        {navItems.map((item) => (
          <button key={item.label} type="button" style={{ ...baseButton, textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "11px 9px", color: "rgba(255,255,255,.83)", background: "transparent", fontSize: 12 }}>
            <Icon name={item.icon} size={15} />{item.label}
          </button>
        ))}
        <div style={{ color: "#c6b9ff", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "23px 7px 10px" }}>QUẢN LÝ ĐÀO TẠO</div>
        <button type="button" aria-current="page" style={{ ...baseButton, textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "11px 9px", color: "#fff", background: "rgba(255,255,255,.2)", fontWeight: 650, fontSize: 12, boxShadow: "inset 3px 0 #fff" }}>
          <Icon name="book" size={15} />Chương trình đào tạo
        </button>
        <a href="/subjects" style={{ ...baseButton, textDecoration: "none", textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "11px 9px", color: "rgba(255,255,255,.83)", background: "transparent", fontSize: 12 }}>
          <Icon name="book" size={15} />Danh mục môn học
        </a>
        {["Nội dung đào tạo", "Giảng viên"].map((item) => (
          <button key={item} type="button" style={{ ...baseButton, textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "11px 9px", color: "rgba(255,255,255,.83)", background: "transparent", fontSize: 12 }}>
            <Icon name={item === "Giảng viên" ? "users" : "book"} size={15} />{item}
          </button>
        ))}
        <div style={{ color: "#c6b9ff", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "23px 7px 10px" }}>QUẢN TRỊ HỆ THỐNG</div>
        {["Vai trò & phân quyền", "Cài đặt"].map((item) => (
          <button key={item} type="button" style={{ ...baseButton, textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "11px 9px", color: "rgba(255,255,255,.83)", background: "transparent", fontSize: 12 }}>
            <Icon name="grid" size={15} />{item}
          </button>
        ))}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,.2)", paddingTop: 15 }}>
          <div style={{ background: "rgba(255,255,255,.13)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, padding: 13, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, background: "#fff", color: colors.purple, borderRadius: 8, display: "grid", placeItems: "center", marginBottom: 10 }}><Icon name="book" size={16} /></div>
            <strong style={{ fontSize: 11 }}>Chuẩn hóa đào tạo</strong>
            <div style={{ fontSize: 10, lineHeight: 1.5, opacity: 0.76, marginTop: 5 }}>Tái sử dụng chương trình để mở lớp nhanh và nhất quán hơn.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 2px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#fff", color: colors.purple, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 10 }}>QL</div>
            <div><strong style={{ display: "block", fontSize: 11 }}>Quản lý đào tạo</strong><span style={{ opacity: 0.7, fontSize: 9 }}>Training Manager</span></div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <header style={{ height: 58, background: "#fff", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", boxSizing: "border-box" }}>
          <div style={{ color: colors.muted, fontSize: 12 }}>Quản lý đào tạo <span style={{ padding: "0 9px", color: "#c4c0d1" }}>›</span><strong style={{ color: colors.ink, fontWeight: 600 }}>Chương trình đào tạo</strong></div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, color: colors.muted, fontSize: 11 }}><span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="help" size={15} />Trung tâm trợ giúp</span><span style={{ width: 30, height: 30, borderRadius: "50%", background: colors.purple, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>QL</span></div>
        </header>

        <section style={{ maxWidth: 1160, margin: "0 auto", padding: "31px 30px 48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, flexWrap: "wrap", marginBottom: 23 }}>
            <div>
              <div style={{ color: colors.purple, fontWeight: 750, fontSize: 10, letterSpacing: 1.3, marginBottom: 7 }}>DANH MỤC ĐÀO TẠO</div>
              <h1 style={{ margin: 0, fontWeight: 650, fontSize: 26, letterSpacing: "-.6px" }}>Chương trình đào tạo</h1>
              <p style={{ color: colors.muted, margin: "7px 0 0", fontSize: 12 }}>Quản lý chương trình mẫu để mở lớp nhanh chóng và đồng bộ.</p>
            </div>
            <button type="button" onClick={openCreateForm} style={{ ...baseButton, background: colors.purple, color: "#fff", padding: "11px 16px", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 650, boxShadow: "0 5px 12px rgba(104,70,214,.2)" }}>
              <Icon name="plus" size={16} />Thêm chương trình
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Tổng chương trình", value: programs.length, accent: colors.purple, background: colors.purplePale, hint: "Danh mục hiện có" },
              { label: "Đang áp dụng", value: activeCount, accent: colors.green, background: "#e9f7f3", hint: "Sẵn sàng mở lớp" },
              { label: "Ngừng áp dụng", value: inactiveCount, accent: "#dc8a36", background: "#fff4e8", hint: "Lưu trữ an toàn" },
            ].map((metric) => (
              <div key={metric.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 3px 12px rgba(38,25,80,.025)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: metric.background, color: metric.accent, display: "grid", placeItems: "center" }}><Icon name="book" size={17} /></div>
                <div style={{ flex: 1 }}><div style={{ color: colors.muted, fontSize: 11 }}>{metric.label}</div><div style={{ fontSize: 19, lineHeight: 1.4, fontWeight: 700 }}>{metric.value}</div></div>
                <span style={{ color: colors.muted, fontSize: 9, textAlign: "right" }}>{metric.hint}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 11, overflow: "hidden", boxShadow: "0 8px 28px rgba(38,25,80,.035)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "12px 15px", borderBottom: `1px solid ${colors.border}` }}>
              <div role="group" aria-label="Lọc theo trạng thái" style={{ display: "flex", gap: 4 }}>
                {([
                  ["ALL", "Tất cả"],
                  ["ACTIVE", "Đang áp dụng"],
                  ["INACTIVE", "Ngừng áp dụng"],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setStatusFilter(value)} style={{ ...baseButton, borderRadius: 0, padding: "10px 9px", color: statusFilter === value ? colors.purple : colors.muted, background: "#fff", fontSize: 11, fontWeight: statusFilter === value ? 700 : 500, borderBottom: statusFilter === value ? `2px solid ${colors.purple}` : "2px solid transparent" }}>{label}{value === "ALL" && <span style={{ marginLeft: 5, background: colors.purplePale, color: colors.purple, borderRadius: 5, padding: "2px 5px", fontSize: 9 }}>{programs.length}</span>}</button>
                ))}
              </div>
              <label style={{ position: "relative", display: "flex", alignItems: "center", minWidth: 240, flex: "0 1 275px" }}>
                <span style={{ position: "absolute", left: 10, color: "#aaa5b7", display: "flex" }}><Icon name="search" size={15} /></span>
                <input aria-label="Tìm theo mã hoặc tên chương trình" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo mã hoặc tên chương trình..." style={{ ...fieldStyle, padding: "9px 10px 9px 32px", fontSize: 11 }} />
              </label>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#fbfafd", color: colors.muted, fontSize: 9, letterSpacing: ".5px" }}>
                    {["MÃ CHƯƠNG TRÌNH", "TÊN CHƯƠNG TRÌNH", "TỔNG THỜI LƯỢNG", "HỌC PHÍ CHUẨN", "TRẠNG THÁI", "THAO TÁC"].map((heading) => (
                      <th key={heading} style={{ padding: "12px 14px", fontWeight: 700, borderBottom: `1px solid ${colors.border}`, whiteSpace: "nowrap" }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPrograms.map((program) => (
                    <tr key={program.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: "15px 14px", fontSize: 11, color: "#777287", fontWeight: 600, whiteSpace: "nowrap" }}>{program.code}</td>
                      <td style={{ padding: "13px 14px", maxWidth: 280 }}>
                        <strong style={{ display: "block", fontSize: 12, fontWeight: 650, color: colors.ink }}>{program.name}</strong>
                        {program.description && <span style={{ display: "block", color: colors.muted, fontSize: 10, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{program.description}</span>}
                      </td>
                      <td style={{ padding: "15px 14px", fontSize: 11, whiteSpace: "nowrap" }}>{program.totalDuration} giờ</td>
                      <td style={{ padding: "15px 14px", fontSize: 11, whiteSpace: "nowrap" }}>{formatCurrency(program.standardTuition)}</td>
                      <td style={{ padding: "15px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: program.status === "ACTIVE" ? "#268b71" : "#858092", fontSize: 10 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: program.status === "ACTIVE" ? "#42bd9c" : "#aaa6b3" }} />
                          {program.status === "ACTIVE" ? "Đang áp dụng" : "Ngừng áp dụng"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <button type="button" aria-label={`Chỉnh sửa ${program.name}`} title="Chỉnh sửa" onClick={() => openEditForm(program)} style={{ ...baseButton, background: "transparent", color: colors.purple, padding: 7, display: "flex" }}><Icon name="edit" size={15} /></button>
                          {program.status === "ACTIVE" && <button type="button" aria-label={`Ngừng áp dụng ${program.name}`} title="Ngừng áp dụng" onClick={() => setConfirming({ id: program.id, action: "deactivate" })} style={{ ...baseButton, background: "transparent", color: "#aa7c31", padding: 7, fontSize: 10 }}>Ngừng</button>}
                          <button type="button" aria-label={program.hasRunningClasses ? `Không thể xóa ${program.name} vì đang có lớp chạy` : `Xóa ${program.name}`} title={program.hasRunningClasses ? "Không thể xóa: chương trình đang có lớp chạy" : "Xóa chương trình"} disabled={program.hasRunningClasses} onClick={() => setConfirming({ id: program.id, action: "delete" })} style={{ ...baseButton, background: "transparent", color: program.hasRunningClasses ? "#c5c2cc" : colors.red, padding: 7, display: "flex", cursor: program.hasRunningClasses ? "not-allowed" : "pointer" }}><Icon name="trash" size={15} /></button>
                        </div>
                        {program.hasRunningClasses && <span style={{ display: "block", color: colors.muted, fontSize: 9, marginTop: 1 }}>Đang có lớp chạy · không thể xóa</span>}
                      </td>
                    </tr>
                  ))}
                  {filteredPrograms.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "52px 20px" }}>
                        <div style={{ width: 46, height: 46, margin: "0 auto 12px", display: "grid", placeItems: "center", borderRadius: 14, background: colors.purplePale, color: colors.purple }}><Icon name="search" size={21} /></div>
                        <strong style={{ display: "block", fontSize: 13 }}>Không tìm thấy chương trình</strong>
                        <span style={{ display: "block", color: colors.muted, fontSize: 11, marginTop: 5 }}>{programs.length === 0 ? "Danh mục đang trống. Hãy thêm chương trình đầu tiên." : "Thử thay đổi từ khóa hoặc bộ lọc trạng thái."}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 15px", color: colors.muted, fontSize: 10, background: "#fff" }}>Hiển thị {filteredPrograms.length} / {programs.length} chương trình</div>
          </div>
        </section>
      </main>

      {formOpen && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 10, background: "rgba(30,23,52,.42)", display: "grid", placeItems: "center", padding: 18 }}>
          <section role="dialog" aria-modal="true" aria-labelledby="training-program-form-title" style={{ width: "min(100%, 540px)", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box", borderRadius: 14, background: "#fff", boxShadow: "0 20px 70px rgba(30,23,52,.25)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
              <div><h2 id="training-program-form-title" style={{ fontSize: 19, margin: "0 0 6px" }}>{editingProgram ? "Chỉnh sửa chương trình" : "Thêm chương trình"}</h2><p style={{ margin: 0, color: colors.muted, fontSize: 11 }}>Điền thông tin chương trình đào tạo.</p></div>
              <button type="button" aria-label="Đóng" onClick={() => setFormOpen(false)} style={{ ...baseButton, color: colors.muted, background: "#f6f5f9", padding: 7, display: "flex" }}><Icon name="close" size={17} /></button>
            </div>
            <form onSubmit={saveProgram} noValidate>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 12px" }}>
                <label style={{ gridColumn: "1 / -1", color: colors.ink, fontSize: 11, fontWeight: 650 }}>Mã chương trình <span style={{ color: colors.red }}>*</span>
                  <input autoFocus value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Ví dụ: CT-DA-007" style={{ ...fieldStyle, marginTop: 7, borderColor: errors.code ? colors.red : colors.border }} />
                  {errors.code && <span role="alert" style={{ display: "block", color: colors.red, fontSize: 10, marginTop: 5 }}>{errors.code}</span>}
                </label>
                <label style={{ gridColumn: "1 / -1", color: colors.ink, fontSize: 11, fontWeight: 650 }}>Tên chương trình <span style={{ color: colors.red }}>*</span>
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nhập tên chương trình" style={{ ...fieldStyle, marginTop: 7, borderColor: errors.name ? colors.red : colors.border }} />
                  {errors.name && <span role="alert" style={{ display: "block", color: colors.red, fontSize: 10, marginTop: 5 }}>{errors.name}</span>}
                </label>
                <label style={{ gridColumn: "1 / -1", color: colors.ink, fontSize: 11, fontWeight: 650 }}>Mô tả
                  <textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mô tả ngắn về chương trình" style={{ ...fieldStyle, marginTop: 7, resize: "vertical" }} />
                </label>
                <label style={{ color: colors.ink, fontSize: 11, fontWeight: 650 }}>Tổng thời lượng (giờ) <span style={{ color: colors.red }}>*</span>
                  <input type="number" min="0.01" step="any" value={form.totalDuration} onChange={(event) => setForm((current) => ({ ...current, totalDuration: event.target.value === "" ? Number.NaN : Number(event.target.value) }))} style={{ ...fieldStyle, marginTop: 7, borderColor: errors.totalDuration ? colors.red : colors.border }} />
                  {errors.totalDuration && <span role="alert" style={{ display: "block", color: colors.red, fontSize: 10, marginTop: 5 }}>{errors.totalDuration}</span>}
                </label>
                <label style={{ color: colors.ink, fontSize: 11, fontWeight: 650 }}>Học phí chuẩn (₫) <span style={{ color: colors.red }}>*</span>
                  <input type="number" min="0" step="1" value={form.standardTuition} onChange={(event) => setForm((current) => ({ ...current, standardTuition: event.target.value === "" ? Number.NaN : Number(event.target.value) }))} style={{ ...fieldStyle, marginTop: 7, borderColor: errors.standardTuition ? colors.red : colors.border }} />
                  {errors.standardTuition && <span role="alert" style={{ display: "block", color: colors.red, fontSize: 10, marginTop: 5 }}>{errors.standardTuition}</span>}
                </label>
                <label style={{ gridColumn: "1 / -1", color: colors.ink, fontSize: 11, fontWeight: 650 }}>Trạng thái
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TrainingProgramStatus }))} style={{ ...fieldStyle, marginTop: 7 }}>
                    <option value="ACTIVE">Đang áp dụng</option><option value="INACTIVE">Ngừng áp dụng</option>
                  </select>
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "end", gap: 9, marginTop: 24 }}>
                <button type="button" onClick={() => setFormOpen(false)} style={{ ...baseButton, background: "#f4f2f8", color: colors.ink, padding: "10px 15px", fontSize: 11 }}>Hủy</button>
                <button type="submit" style={{ ...baseButton, background: colors.purple, color: "#fff", padding: "10px 16px", fontWeight: 650, fontSize: 11 }}>{editingProgram ? "Lưu thay đổi" : "Tạo chương trình"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {confirming && targetProgram && (
        <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 11, background: "rgba(30,23,52,.42)", display: "grid", placeItems: "center", padding: 18 }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="training-program-confirm-title" style={{ width: "min(100%, 410px)", boxSizing: "border-box", borderRadius: 14, background: "#fff", boxShadow: "0 20px 70px rgba(30,23,52,.25)", padding: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: confirming.action === "delete" ? "#fff0f1" : "#fff4e8", color: confirming.action === "delete" ? colors.red : "#d08a36", display: "grid", placeItems: "center", marginBottom: 14 }}><Icon name={confirming.action === "delete" ? "trash" : "book"} size={18} /></div>
            <h2 id="training-program-confirm-title" style={{ margin: "0 0 8px", fontSize: 17 }}>{confirming.action === "delete" ? "Xóa chương trình?" : "Ngừng áp dụng chương trình?"}</h2>
            <p style={{ margin: 0, color: colors.muted, fontSize: 12, lineHeight: 1.6 }}>
              {confirming.action === "delete"
                ? <>Chương trình <strong style={{ color: colors.ink }}>{targetProgram.name}</strong> sẽ bị xóa khỏi danh mục. Thao tác này không thể hoàn tác.</>
                : <>Chương trình <strong style={{ color: colors.ink }}>{targetProgram.name}</strong> sẽ được chuyển sang trạng thái ngừng áp dụng. Dữ liệu chương trình vẫn được lưu và không thể chọn để mở lớp mới.</>}
            </p>
            <div style={{ display: "flex", justifyContent: "end", gap: 9, marginTop: 22 }}>
              <button type="button" onClick={() => setConfirming(null)} style={{ ...baseButton, background: "#f4f2f8", color: colors.ink, padding: "10px 15px", fontSize: 11 }}>Hủy</button>
              <button type="button" onClick={confirmAction} style={{ ...baseButton, background: confirming.action === "delete" ? colors.red : colors.purple, color: "#fff", padding: "10px 15px", fontWeight: 650, fontSize: 11 }}>{confirming.action === "delete" ? "Xóa chương trình" : "Xác nhận ngừng"}</button>
            </div>
          </section>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 16, right: 16, width: 34, height: 34, borderRadius: "50%", background: "#fff", color: colors.muted, display: "grid", placeItems: "center", boxShadow: "0 2px 9px rgba(38,25,80,.13)" }}><Icon name="help" size={18} /></div>
    </div>
  );
}
