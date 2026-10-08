import { useMemo, useState } from "react";
import { sampleSubjects } from "../data/sampleSubjects";
import type { Subject, SubjectInput } from "../types/subject";

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(sampleSubjects);
  const [query, setQuery] = useState("");

  const filteredSubjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    if (!normalizedQuery) return subjects;

    return subjects.filter(
      (subject) =>
        subject.code.toLocaleLowerCase("vi").includes(normalizedQuery) ||
        subject.name.toLocaleLowerCase("vi").includes(normalizedQuery),
    );
  }, [query, subjects]);

  function isCodeTaken(code: string, exceptId?: string) {
    const normalizedCode = code.trim().toLocaleLowerCase("vi");
    return subjects.some(
      (subject) =>
        subject.id !== exceptId &&
        subject.code.trim().toLocaleLowerCase("vi") === normalizedCode,
    );
  }

  function addSubject(input: SubjectInput) {
    const newSubject: Subject = {
      ...input,
      id: `subject-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      hasClasses: false,
      programIds: [],
    };
    setSubjects((current) => [newSubject, ...current]);
  }

  function updateSubject(id: string, input: SubjectInput) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === id ? { ...subject, ...input } : subject,
      ),
    );
  }

  function deleteSubject(id: string) {
    setSubjects((current) => {
      const subject = current.find((item) => item.id === id);
      if (!subject || subject.hasClasses) return current;
      return current.filter((item) => item.id !== id);
    });
  }

  return {
    subjects,
    filteredSubjects,
    query,
    setQuery,
    isCodeTaken,
    addSubject,
    updateSubject,
    deleteSubject,
  };
}
