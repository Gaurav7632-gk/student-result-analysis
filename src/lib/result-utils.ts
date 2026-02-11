import { Subject, ResultStatus } from "@/types/result";

export function calculatePercentage(subjects: Subject[]): number {
  const totalMax = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const totalObtained = subjects.reduce((sum, s) => sum + s.marksObtained, 0);
  if (totalMax === 0) return 0;
  return (totalObtained / totalMax) * 100;
}

export function getResultStatus(percentage: number, subjects: Subject[]): ResultStatus {
  const hasFailed = subjects.some(
    (s) => s.marksObtained < s.maxMarks * 0.4
  );
  if (hasFailed) return "Fail";
  if (percentage >= 75) return "Distinction";
  if (percentage >= 60) return "First Class";
  if (percentage >= 50) return "Second Class";
  return "Pass";
}

export function getStatusColor(status: ResultStatus): string {
  switch (status) {
    case "Distinction": return "text-amber-500";
    case "First Class": return "text-emerald-500";
    case "Second Class": return "text-blue-500";
    case "Pass": return "text-green-600";
    case "Fail": return "text-red-500";
  }
}

export function getStatusBg(status: ResultStatus): string {
  switch (status) {
    case "Distinction": return "bg-amber-50 border-amber-200";
    case "First Class": return "bg-emerald-50 border-emerald-200";
    case "Second Class": return "bg-blue-50 border-blue-200";
    case "Pass": return "bg-green-50 border-green-200";
    case "Fail": return "bg-red-50 border-red-200";
  }
}

export function isSubjectPass(subject: Subject): boolean {
  return subject.marksObtained >= subject.maxMarks * 0.4;
}

export function createSubject(): Subject {
  return { id: crypto.randomUUID(), name: "", maxMarks: 100, marksObtained: 0 };
}
