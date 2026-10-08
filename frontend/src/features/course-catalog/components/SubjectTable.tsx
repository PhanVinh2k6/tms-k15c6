import type { CSSProperties } from "react";
import type { Subject } from "../types/subject";

interface SubjectTableProps {
  subjects: Subject[];
  hasSearchQuery: boolean;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

const headerCell: CSSProperties = {
  padding: "13px 14px",
  color: "#837e94",
  background: "#faf9fc",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: "0.045em",
  textAlign: "left",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const cell: CSSProperties = {
  padding: "15px 14px",
  borderTop: "1px solid #f0edf5",
  color: "#514d62",
  fontSize: 12,
  verticalAlign: "middle",
};

export function SubjectTable({
  subjects,
  hasSearchQuery,
  onEdit,
  onDelete,
}: SubjectTableProps) {
  if (subjects.length === 0) {
    return (
      <div
        style={{
          padding: "58px 20px",
          textAlign: "center",
          color: "#858096",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "grid",
            placeItems: "center",
            width: 52,
            height: 52,
            margin: "0 auto 14px",
            borderRadius: 16,
            background: "#f2edff",
            color: "#7048d8",
            fontSize: 23,
          }}
        >
          ◫
        </div>
        <strong style={{ display: "block", color: "#39354a", fontSize: 14 }}>
          {hasSearchQuery ? "Không tìm thấy môn học phù hợp" : "Chưa có môn học nào"}
        </strong>
        <span style={{ display: "block", marginTop: 6, fontSize: 12 }}>
          {hasSearchQuery
            ? "Thử tìm bằng mã hoặc tên môn học khác."
            : "Thêm môn học đầu tiên vào danh mục đào tạo."}
        </span>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 880,
          borderCollapse: "collapse",
          textAlign: "left",
        }}
      >
        <thead>
          <tr>
            <th style={headerCell}>Mã môn học</th>
            <th style={headerCell}>Tên môn học</th>
            <th style={headerCell}>Số buổi</th>
            <th style={headerCell}>Trọng số</th>
            <th style={{ ...headerCell, minWidth: 260 }}>Chuẩn đầu ra</th>
            <th style={headerCell}>Lớp học</th>
            <th style={{ ...headerCell, textAlign: "right" }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.id}>
              <td style={cell}>
                <span
                  style={{
                    borderRadius: 5,
                    background: "#f5f1ff",
                    padding: "5px 7px",
                    color: "#6743c7",
                    fontSize: 11,
                    fontWeight: 650,
                    whiteSpace: "nowrap",
                  }}
                >
                  {subject.code}
                </span>
              </td>
              <td style={{ ...cell, color: "#302b40", fontWeight: 650 }}>
                {subject.name}
                {subject.programIds.length > 1 && (
                  <span
                    title={`Có thể tái sử dụng trong ${subject.programIds.length} chương trình đào tạo`}
                    style={{
                      display: "block",
                      marginTop: 5,
                      color: "#8d879b",
                      fontSize: 10,
                      fontWeight: 400,
                    }}
                  >
                    Dùng chung · {subject.programIds.length} chương trình
                  </span>
                )}
              </td>
              <td style={cell}>{subject.numberOfSessions} buổi</td>
              <td style={cell}>{subject.weight}</td>
              <td style={cell}>
                <span
                  style={{
                    display: "block",
                    maxWidth: 300,
                    overflow: "hidden",
                    color: "#777286",
                    lineHeight: 1.55,
                    textOverflow: "ellipsis",
                    whiteSpace: "pre-line",
                  }}
                  title={subject.learningOutcomes || "Chưa có mô tả"}
                >
                  {subject.learningOutcomes || "Chưa có mô tả"}
                </span>
              </td>
              <td style={cell}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: subject.hasClasses ? "#288b71" : "#8b8799",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: subject.hasClasses ? "#38ae8a" : "#c4c0ce",
                    }}
                  />
                  {subject.hasClasses ? "Đã có lớp" : "Chưa có lớp"}
                </span>
              </td>
              <td style={{ ...cell, textAlign: "right", whiteSpace: "nowrap" }}>
                <button
                  type="button"
                  onClick={() => onEdit(subject)}
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: "6px 8px",
                    color: "#6544bd",
                    font: "inherit",
                    fontSize: 11,
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  disabled={subject.hasClasses}
                  title={
                    subject.hasClasses
                      ? "Môn học đã có lớp học nên không thể xoá."
                      : "Xoá môn học"
                  }
                  aria-label={`Xoá môn ${subject.name}`}
                  onClick={() => onDelete(subject)}
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: "6px 8px",
                    color: subject.hasClasses ? "#c2bfca" : "#c4495b",
                    font: "inherit",
                    fontSize: 11,
                    fontWeight: 650,
                    cursor: subject.hasClasses ? "not-allowed" : "pointer",
                  }}
                >
                  Xoá
                </button>
                {subject.hasClasses && (
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      color: "#928da0",
                      fontSize: 9,
                    }}
                  >
                    Đã có lớp, không thể xoá
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
