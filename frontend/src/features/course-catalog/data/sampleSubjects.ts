import type { Subject } from "../types/subject";

export const sampleSubjects: Subject[] = [
  {
    id: "subject-001",
    code: "MH-DA-001",
    name: "Nền tảng phân tích dữ liệu",
    numberOfSessions: 12,
    weight: 2,
    learningOutcomes:
      "Phân tích và diễn giải dữ liệu cơ bản.\nSử dụng công cụ trực quan hóa dữ liệu.",
    hasClasses: true,
    programIds: ["program-data", "program-digital"],
  },
  {
    id: "subject-002",
    code: "MH-CN-002",
    name: "Excel nâng cao trong công việc",
    numberOfSessions: 8,
    weight: 1.5,
    learningOutcomes:
      "Xây dựng công thức và bảng tính nâng cao.\nTự động hóa báo cáo bằng Excel.",
    hasClasses: false,
    programIds: ["program-office"],
  },
  {
    id: "subject-003",
    code: "MH-QL-003",
    name: "Lãnh đạo và quản lý đội ngũ",
    numberOfSessions: 10,
    weight: 2,
    learningOutcomes:
      "Vận dụng kỹ năng giao việc và phản hồi.\nXây dựng kế hoạch phát triển đội ngũ.",
    hasClasses: false,
    programIds: [],
  },
  {
    id: "subject-004",
    code: "MH-KN-004",
    name: "Giao tiếp hiệu quả",
    numberOfSessions: 6,
    weight: 1,
    learningOutcomes:
      "Giao tiếp rõ ràng trong môi trường công việc.\nLắng nghe chủ động và xử lý tình huống.",
    hasClasses: true,
    programIds: ["program-data", "program-office", "program-leadership"],
  },
  {
    id: "subject-005",
    code: "MH-AT-005",
    name: "An toàn thông tin cơ bản",
    numberOfSessions: 6,
    weight: 1.5,
    learningOutcomes:
      "Nhận diện rủi ro an toàn thông tin.\nThực hành các nguyên tắc bảo vệ dữ liệu.",
    hasClasses: false,
    programIds: ["program-digital"],
  },
];
