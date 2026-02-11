export interface Subject {
  id: string;
  name: string;
  maxMarks: number;
  marksObtained: number;
}

export interface StudentInfo {
  name: string;
  rollNumber: string;
  registrationNumber: string;
  universityName: string;
  courseName: string;
  semester: number;
  academicYear: string;
}

export interface ResultData {
  id: string;
  student: StudentInfo;
  subjects: Subject[];
  createdAt: string;
}

export type ResultStatus = "Distinction" | "First Class" | "Second Class" | "Pass" | "Fail";
