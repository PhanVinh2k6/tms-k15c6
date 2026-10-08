import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { Subject, SubjectInput } from "../types/subject";

interface SubjectFormProps {
  subject?: Subject;
  isCodeTaken: (code: string, exceptId?: string) => boolean;
  onSave: (input: SubjectInput) => void;
  onClose: () => void;
}

type SubjectFormValues = {
  code: string;
  name: string;
  numberOfSessions: string;
  weight: string;
  learningOutcomes: string;
};

type SubjectFormErrors = Partial<Record<keyof SubjectFormValues, string>>;

const createSubjectFormInitialValues = (subject?: Subject): SubjectFormValues => ({
  code: subject?.code ?? "",
  name: subject?.name ?? "",
  numberOfSessions: subject ? String(subject.numberOfSessions) : "",
  weight: subject ? String(subject.weight) : "",
  learningOutcomes: subject?.learningOutcomes ?? "",
});

const subjectFormLabelStyle: CSSProperties = {
  display: "block",
  color: "#36334a",
  fontSize: 13,
  fontWeight: 650,
  marginBottom: 7,
};

const subjectFormInputStyle: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  border: "1px solid #e5e1ef",
  borderRadius: 9,
  background: "#fff",
  padding: "11px 12px",
  color: "#28243b",
  font: "inherit",
  fontSize: 13,
  outlineColor: "#7650df",
};

export function SubjectForm({
  subject,
  isCodeTaken,
  onSave,
  onClose,
}: SubjectFormProps) {
  const [subjectFormValues, setSubjectFormValues] = useState<SubjectFormValues>(
    () => createSubjectFormInitialValues(subject),
  );
  const [subjectFormErrors, setSubjectFormErrors] = useState<SubjectFormErrors>({});

  function updateSubjectFormField(field: keyof SubjectFormValues, value: string) {
    setSubjectFormValues((current) => ({ ...current, [field]: value }));
    setSubjectFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubjectFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSubjectFormErrors: SubjectFormErrors = {};
    const subjectSessionCount = Number(subjectFormValues.numberOfSessions);
    const subjectWeight = Number(subjectFormValues.weight);

    if (!subjectFormValues.code.trim()) nextSubjectFormErrors.code = "Nhập mã môn học.";
    else if (isCodeTaken(subjectFormValues.code, subject?.id))
      nextSubjectFormErrors.code = "Mã môn học này đã tồn tại.";

    if (!subjectFormValues.name.trim()) nextSubjectFormErrors.name = "Nhập tên môn học.";

    if (!subjectFormValues.numberOfSessions.trim()) {
      nextSubjectFormErrors.numberOfSessions = "Nhập số buổi.";
    } else if (!Number.isInteger(subjectSessionCount) || subjectSessionCount <= 0) {
      nextSubjectFormErrors.numberOfSessions = "Số buổi phải là số nguyên dương.";
    }

    if (!subjectFormValues.weight.trim()) {
      nextSubjectFormErrors.weight = "Nhập trọng số.";
    } else if (!Number.isFinite(subjectWeight) || subjectWeight <= 0) {
      nextSubjectFormErrors.weight = "Trọng số phải là số dương hợp lệ.";
    }

    setSubjectFormErrors(nextSubjectFormErrors);
    if (Object.keys(nextSubjectFormErrors).length > 0) return;

    onSave({
      code: subjectFormValues.code.trim(),
      name: subjectFormValues.name.trim(),
      numberOfSessions: subjectSessionCount,
      weight: subjectWeight,
      learningOutcomes: subjectFormValues.learningOutcomes.trim(),
    });
  }

  function renderSubjectFormField(
    key: "code" | "name" | "numberOfSessions" | "weight",
    label: string,
    placeholder: string,
    type = "text",
  ) {
    return (
      <div>
        <label htmlFor={`subject-${key}`} style={subjectFormLabelStyle}>
          {label} <span style={{ color: "#dc5267" }}>*</span>
        </label>
        <input
          id={`subject-${key}`}
          name={`subject-${key}`}
          type={type}
          value={subjectFormValues[key]}
          placeholder={placeholder}
          onChange={(event) => updateSubjectFormField(key, event.target.value)}
          aria-invalid={Boolean(subjectFormErrors[key])}
          aria-describedby={subjectFormErrors[key] ? `subject-${key}-error` : undefined}
          style={{
            ...subjectFormInputStyle,
            borderColor: subjectFormErrors[key] ? "#dc5267" : "#e5e1ef",
          }}
        />
        {subjectFormErrors[key] && (
          <p
            id={`subject-${key}-error`}
            role="alert"
            style={{ margin: "6px 0 0", color: "#c43f55", fontSize: 12 }}
          >
            {subjectFormErrors[key]}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "rgba(30, 24, 52, 0.42)",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-form-title"
        style={{
          width: "min(100%, 560px)",
          maxHeight: "min(90vh, 760px)",
          overflowY: "auto",
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 24px 80px rgba(35, 25, 70, 0.25)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "23px 26px 18px",
            borderBottom: "1px solid #f0edf6",
          }}
        >
          <div>
            <div
              style={{
                color: "#7551d9",
                fontSize: 10,
                fontWeight: 750,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
              }}
            >
              Danh mục đào tạo
            </div>
            <h2
              id="subject-form-title"
              style={{
                margin: "6px 0 0",
                color: "#29243b",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {subject ? "Chỉnh sửa môn học" : "Thêm môn học"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              color: "#89859a",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </header>
        <form onSubmit={handleSubjectFormSubmit} noValidate>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px 16px",
              padding: 26,
            }}
          >
            {renderSubjectFormField("code", "Mã môn học", "Ví dụ: MH-CN-006")}
            {renderSubjectFormField("name", "Tên môn học", "Nhập tên môn học")}
            {renderSubjectFormField("numberOfSessions", "Số buổi", "Ví dụ: 12", "number")}
            {renderSubjectFormField("weight", "Trọng số", "Ví dụ: 1.5", "number")}
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="subject-learning-outcomes" style={subjectFormLabelStyle}>
                Mô tả chuẩn đầu ra
              </label>
              <textarea
                id="subject-learning-outcomes"
                name="subject-learning-outcomes"
                rows={5}
                value={subjectFormValues.learningOutcomes}
                placeholder="Mỗi chuẩn đầu ra có thể nhập trên một dòng..."
                onChange={(event) =>
                  updateSubjectFormField("learningOutcomes", event.target.value)
                }
                style={{ ...subjectFormInputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#918da0",
                  fontSize: 11,
                }}
              >
                Mô tả những kiến thức, kỹ năng người học đạt được sau môn học.
              </p>
            </div>
          </div>
          <footer
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              padding: "16px 26px 22px",
              borderTop: "1px solid #f0edf6",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "1px solid #e5e1ef",
                borderRadius: 9,
                background: "#fff",
                padding: "10px 16px",
                color: "#5f5a70",
                font: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Huỷ
            </button>
            <button
              type="submit"
              style={{
                border: 0,
                borderRadius: 9,
                background: "#7048d8",
                padding: "10px 18px",
                color: "#fff",
                font: "inherit",
                fontSize: 13,
                fontWeight: 650,
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(112, 72, 216, 0.2)",
              }}
            >
              {subject ? "Lưu thay đổi" : "Thêm môn học"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
