import { useState } from "react";
import type { CSSProperties } from "react";
import { SubjectForm } from "./components/SubjectForm";
import { SubjectTable } from "./components/SubjectTable";
import { useSubjects } from "./hooks/useSubjects";
import type { Subject, SubjectInput } from "./types/subject";

const subjectPurple = "#7048d8";

const subjectButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: 0,
  borderRadius: 9,
  background: subjectPurple,
  padding: "11px 16px",
  color: "#fff",
  font: "inherit",
  fontSize: 12,
  fontWeight: 650,
  cursor: "pointer",
  boxShadow: "0 5px 12px rgba(92, 58, 190, 0.2)",
};

const subjectNavGroups = [
  {
    label: "KHÔNG GIAN LÀM VIỆC",
    links: ["Tổng quan", "Khoá học", "Lớp học", "Học viên", "Báo cáo"],
  },
  {
    label: "QUẢN LÝ ĐÀO TẠO",
    links: ["Chương trình đào tạo", "Danh mục môn học", "Giảng viên"],
  },
  { label: "QUẢN TRỊ HỆ THỐNG", links: ["Vai trò & phân quyền", "Cài đặt"] },
];

export function SubjectManagement() {
  const {
    subjects,
    filteredSubjects,
    query,
    setQuery: setSubjectQuery,
    isCodeTaken,
    addSubject,
    updateSubject,
    deleteSubject,
  } = useSubjects();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false);

  function saveSubject(input: SubjectInput) {
    if (editingSubject) updateSubject(editingSubject.id, input);
    else addSubject(input);
    closeSubjectForm();
  }

  function closeSubjectForm() {
    setIsSubjectFormOpen(false);
    setEditingSubject(null);
  }

  function openSubjectEdit(subject: Subject) {
    setEditingSubject(subject);
    setIsSubjectFormOpen(true);
  }

  function confirmSubjectDelete(subject: Subject) {
    if (subject.hasClasses) return;
    const confirmed = window.confirm(
      `Bạn có chắc muốn xoá môn học "${subject.name}" (${subject.code}) không?`,
    );
    if (confirmed) deleteSubject(subject.id);
  }

  const subjectCountWithClasses = subjects.filter((subject) => subject.hasClasses).length;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8f7fc",
        color: "#302c41",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <aside
        style={{
          display: "flex",
          width: 224,
          flex: "0 0 224px",
          flexDirection: "column",
          background: "linear-gradient(180deg, #6947d4 0%, #4f34b2 100%)",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: 67,
            padding: "0 20px",
            borderBottom: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <div
            style={{
              display: "grid",
              width: 34,
              height: 34,
              placeItems: "center",
              borderRadius: 10,
              background: "#fff",
              color: subjectPurple,
              fontSize: 19,
              fontWeight: 800,
            }}
          >
            ◈
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 750, letterSpacing: "-0.03em" }}>
              eduflow.
            </div>
            <div
              style={{
                marginTop: 2,
                color: "rgba(255,255,255,0.67)",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.15em",
              }}
            >
              TRAINING PLATFORM
            </div>
          </div>
        </div>

        <nav
          aria-label="Điều hướng chính"
          style={{ flex: 1, padding: "23px 12px 12px" }}
        >
          {subjectNavGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 21 }}>
              <div
                style={{
                  margin: "0 5px 9px",
                  color: "rgba(255,255,255,0.57)",
                  fontSize: 9,
                  fontWeight: 750,
                  letterSpacing: "0.08em",
                }}
              >
                {group.label}
              </div>
              {group.links.map((link, index) => {
                const active = link === "Danh mục môn học";
                const subjectHref =
                  link === "Danh mục môn học"
                    ? "/subjects"
                    : link === "Chương trình đào tạo"
                      ? "/training-programs"
                      : undefined;
                const subjectNavigationStyle: CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 37,
                  marginBottom: 2,
                  borderRadius: 9,
                  border: active
                    ? "1px solid rgba(255,255,255,0.25)"
                    : "1px solid transparent",
                  background: active
                    ? "rgba(255,255,255,0.19)"
                    : "transparent",
                  padding: "0 10px",
                  color: active ? "#fff" : "rgba(255,255,255,0.83)",
                  fontSize: 11,
                  fontWeight: active ? 700 : 550,
                };
                const subjectNavigationContent = (
                  <>
                    <span aria-hidden="true" style={{ opacity: 0.84, fontSize: 14 }}>
                      {["▦", "▣", "▤", "♙", "⌁", "◈", "♙", "⬡", "⚙"][index] ??
                        "•"}
                    </span>
                    {link}
                    {active && (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 5,
                          height: 5,
                          marginLeft: "auto",
                          borderRadius: "50%",
                          background: "#c8b6ff",
                        }}
                      />
                    )}
                  </>
                );
                if (subjectHref) {
                  return (
                    <a
                      key={link}
                      href={subjectHref}
                      aria-current={active ? "page" : undefined}
                      style={{ ...subjectNavigationStyle, textDecoration: "none" }}
                    >
                      {subjectNavigationContent}
                    </a>
                  );
                }
                return (
                  <div
                    key={link}
                    style={subjectNavigationStyle}
                  >
                    {subjectNavigationContent}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div
          style={{
            margin: "0 13px 17px",
            border: "1px solid rgba(255,255,255,0.19)",
            borderRadius: 11,
            background: "rgba(255,255,255,0.1)",
            padding: 13,
          }}
        >
          <div
            style={{
              display: "grid",
              width: 30,
              height: 30,
              placeItems: "center",
              borderRadius: 8,
              background: "#fff",
              color: subjectPurple,
            }}
          >
            ◫
          </div>
          <strong style={{ display: "block", marginTop: 11, fontSize: 10 }}>
            Chuẩn hoá đào tạo
          </strong>
          <p
            style={{
              margin: "5px 0 0",
              color: "rgba(255,255,255,0.71)",
              fontSize: 9,
              lineHeight: 1.6,
            }}
          >
            Dùng lại môn học cho nhiều chương trình mà không khai báo trùng.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "grid",
              width: 29,
              height: 29,
              placeItems: "center",
              borderRadius: "50%",
              background: "#fff",
              color: subjectPurple,
              fontSize: 10,
              fontWeight: 750,
            }}
          >
            QL
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>Quản lý đào tạo</div>
            <div
              style={{
                marginTop: 2,
                color: "rgba(255,255,255,0.63)",
                fontSize: 9,
              }}
            >
              Training Manager
            </div>
          </div>
        </div>
      </aside>

      <main style={{ minWidth: 0, flex: 1 }}>
        <header
          style={{
            display: "flex",
            height: 58,
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #ebe8f2",
            background: "rgba(255,255,255,0.9)",
            padding: "0 28px",
          }}
        >
          <div style={{ color: "#878296", fontSize: 11 }}>
            Quản lý đào tạo <span style={{ padding: "0 9px", color: "#c3bfcd" }}>›</span>
            <strong style={{ color: "#49445a", fontWeight: 600 }}>
              Danh mục môn học
            </strong>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#777286",
              fontSize: 10,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 14 }}>
              ⓘ
            </span>
            Trung tâm trợ giúp
            <span
              style={{
                display: "grid",
                width: 28,
                height: 28,
                placeItems: "center",
                borderRadius: "50%",
                background: subjectPurple,
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                boxShadow: "0 3px 8px rgba(75,46,150,0.24)",
              }}
            >
              QL
            </span>
          </div>
        </header>

        <div
          style={{
            width: "min(calc(100% - 64px), 1120px)",
            margin: "0 auto",
            padding: "34px 0 56px",
          }}
        >
          <section
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 20,
              marginBottom: 22,
            }}
          >
            <div>
              <div
                style={{
                  color: "#7048d8",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.11em",
                }}
              >
                DANH MỤC ĐÀO TẠO
              </div>
              <h1
                style={{
                  margin: "6px 0 5px",
                  color: "#2e293e",
                  fontSize: 25,
                  fontWeight: 650,
                  letterSpacing: "-0.045em",
                }}
              >
                Danh mục môn học
              </h1>
              <p style={{ margin: 0, color: "#898498", fontSize: 12 }}>
                Quản lý môn học dùng chung và tái sử dụng trong các chương trình đào tạo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSubjectFormOpen(true)}
              style={{ ...subjectButtonStyle, flexShrink: 0 }}
            >
              <span aria-hidden="true" style={{ fontSize: 17, lineHeight: 1 }}>
                +
              </span>
              Thêm môn học
            </button>
          </section>

          <section
            aria-label="Tổng quan danh mục"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 14,
              marginBottom: 16,
            }}
          >
            {[
              {
                label: "Tổng môn học",
                value: subjects.length,
                hint: "Trong danh mục",
                icon: "◫",
                color: "#8061dc",
                tint: "#f1ebff",
              },
              {
                label: "Đang sử dụng",
                value: subjectCountWithClasses,
                hint: "Đã có lớp học",
                icon: "✓",
                color: "#43a98a",
                tint: "#e8f7f2",
              },
              {
                label: "Có thể xoá",
                value: subjects.length - subjectCountWithClasses,
                hint: "Chưa có lớp học",
                icon: "◷",
                color: "#d89048",
                tint: "#fff3e5",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 72,
                  border: "1px solid #ebe8f2",
                  borderRadius: 11,
                  background: "#fff",
                  padding: "12px 15px",
                  boxShadow: "0 3px 12px rgba(45, 32, 79, 0.025)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    placeItems: "center",
                    borderRadius: 9,
                    background: item.tint,
                    color: item.color,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#817c91", fontSize: 10 }}>{item.label}</div>
                  <div
                    style={{
                      marginTop: 2,
                      color: "#302c41",
                      fontSize: 19,
                      fontWeight: 720,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    color: "#9893a4",
                    fontSize: 9,
                    textAlign: "right",
                  }}
                >
                  {item.hint}
                </span>
              </div>
            ))}
          </section>

          <section
            aria-label="Danh sách môn học"
            style={{
              overflow: "hidden",
              border: "1px solid #e8e5ef",
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 8px 28px rgba(45, 32, 79, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                padding: "13px 15px",
              }}
            >
              <div style={{ color: "#4d485d", fontSize: 12, fontWeight: 700 }}>
                Tất cả môn học{" "}
                <span
                  style={{
                    marginLeft: 5,
                    borderRadius: 10,
                    background: "#f2edff",
                    padding: "3px 7px",
                    color: "#7048d8",
                    fontSize: 10,
                  }}
                >
                  {subjects.length}
                </span>
              </div>
              <label
                style={{
                  display: "flex",
                  width: "min(100%, 270px)",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #e5e1ed",
                  borderRadius: 8,
                  background: "#fdfcff",
                  padding: "9px 11px",
                  color: "#8e899e",
                  fontSize: 13,
                }}
              >
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  aria-label="Tìm theo tên hoặc mã môn học"
                  placeholder="Tìm theo tên, mã môn học..."
                  value={query}
                  onChange={(event) => setSubjectQuery(event.target.value)}
                  style={{
                    width: "100%",
                    border: 0,
                    outline: 0,
                    background: "transparent",
                    color: "#39354a",
                    font: "inherit",
                    fontSize: 11,
                  }}
                />
              </label>
            </div>

            <SubjectTable
              subjects={filteredSubjects}
              hasSearchQuery={Boolean(query.trim())}
              onEdit={openSubjectEdit}
              onDelete={confirmSubjectDelete}
            />

            {filteredSubjects.length > 0 && (
              <footer
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderTop: "1px solid #f0edf5",
                  padding: "13px 15px",
                  color: "#8e899e",
                  fontSize: 10,
                }}
              >
                Hiển thị {filteredSubjects.length} / {subjects.length} môn học
                <span style={{ color: "#aaa5b5" }}>
                  Danh mục môn học dùng chung
                </span>
              </footer>
            )}
          </section>
        </div>
      </main>

      {isSubjectFormOpen && (
        <SubjectForm
          subject={editingSubject ?? undefined}
          isCodeTaken={isCodeTaken}
          onSave={saveSubject}
          onClose={closeSubjectForm}
        />
      )}
    </div>
  );
}
