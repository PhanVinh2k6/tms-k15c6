import { useMemo, useState } from "react";
import { sampleSubjects } from "../data/sampleSubjects";
import type { Subject, SubjectInput } from "../types/subject";

export function useSubjects() {
  const [subjectList, setSubjectList] = useState<Subject[]>(sampleSubjects);
  const [subjectQuery, setSubjectQuery] = useState("");

  const filteredSubjectList = useMemo(() => {
    const normalizedSubjectQuery = subjectQuery.trim().toLocaleLowerCase("vi");
    if (!normalizedSubjectQuery) return subjectList;

    return subjectList.filter(
      (subject) =>
        subject.code.toLocaleLowerCase("vi").includes(normalizedSubjectQuery) ||
        subject.name.toLocaleLowerCase("vi").includes(normalizedSubjectQuery),
    );
  }, [subjectQuery, subjectList]);

  function isSubjectCodeTaken(code: string, exceptId?: string) {
    const normalizedSubjectCode = code.trim().toLocaleLowerCase("vi");
    return subjectList.some(
      (subject) =>
        subject.id !== exceptId &&
        subject.code.trim().toLocaleLowerCase("vi") === normalizedSubjectCode,
    );
  }

  function addSubject(input: SubjectInput) {
    const newSubject: Subject = {
      ...input,
      id: `subject-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      hasClasses: false,
      programIds: [],
    };
    setSubjectList((current) => [newSubject, ...current]);
  }

  function updateSubject(id: string, input: SubjectInput) {
    setSubjectList((current) =>
      current.map((subject) =>
        subject.id === id ? { ...subject, ...input } : subject,
      ),
    );
  }

  function deleteSubject(id: string) {
    setSubjectList((current) => {
      const subject = current.find((item) => item.id === id);
      if (!subject || subject.hasClasses) return current;
      return current.filter((item) => item.id !== id);
    });
  }

  return {
    subjects: subjectList,
    filteredSubjects: filteredSubjectList,
    query: subjectQuery,
    setQuery: setSubjectQuery,
    isCodeTaken: isSubjectCodeTaken,
    addSubject,
    updateSubject,
    deleteSubject,
  };
}
