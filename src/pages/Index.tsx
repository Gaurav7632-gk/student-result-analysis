import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Plus, Trash2, FileText, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Subject, StudentInfo } from "@/types/result";
import { createSubject, calculatePercentage, getResultStatus, getStatusColor, getStatusBg, isSubjectPass } from "@/lib/result-utils";
import { cn } from "@/lib/utils";

const defaultSubjects = (): Subject[] =>
  Array.from({ length: 5 }, () => createSubject());

const Index = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentInfo>({
    name: "",
    rollNumber: "",
    registrationNumber: "",
    universityName: "",
    courseName: "",
    semester: 1,
    academicYear: "",
  });
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects());

  const updateStudent = (field: keyof StudentInfo, value: string | number) => {
    setStudent((prev) => ({ ...prev, [field]: value }));
  };

  const updateSubject = (id: string, field: keyof Subject, value: string | number) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addSubject = () => setSubjects((prev) => [...prev, createSubject()]);
  const removeSubject = (id: string) =>
    setSubjects((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));

  const percentage = calculatePercentage(subjects);
  const validSubjects = subjects.filter((s) => s.name.trim() && s.maxMarks > 0);
  const status = validSubjects.length > 0 ? getResultStatus(percentage, validSubjects) : null;
  const totalObtained = subjects.reduce((s, sub) => s + sub.marksObtained, 0);
  const totalMax = subjects.reduce((s, sub) => s + sub.maxMarks, 0);

  const isFormValid =
    student.name.trim() &&
    student.universityName.trim() &&
    student.courseName.trim() &&
    student.academicYear.trim() &&
    validSubjects.length > 0 &&
    subjects.every((s) => !s.name.trim() || s.marksObtained <= s.maxMarks);

  const handleGenerate = () => {
    const resultData = {
      id: crypto.randomUUID(),
      student,
      subjects: validSubjects,
      createdAt: new Date().toISOString(),
    };
    navigate("/preview", { state: resultData });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--accent))] via-background to-[hsl(var(--secondary))]">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">UniResult</h1>
              <p className="text-xs text-muted-foreground">Result Sheet Generator</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="gap-2 hover:scale-105 transition-transform">
            <History className="h-4 w-4" /> History
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Student Details */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Student Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Student Name *</Label>
              <Input id="name" placeholder="John Doe" value={student.name} onChange={(e) => updateStudent("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roll">Roll Number</Label>
              <Input id="roll" placeholder="2024001" value={student.rollNumber} onChange={(e) => updateStudent("rollNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg">Registration Number</Label>
              <Input id="reg" placeholder="REG-2024-001" value={student.registrationNumber} onChange={(e) => updateStudent("registrationNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uni">University / College *</Label>
              <Input id="uni" placeholder="State University" value={student.universityName} onChange={(e) => updateStudent("universityName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course">Course Name *</Label>
              <Input id="course" placeholder="B.Tech CSE" value={student.courseName} onChange={(e) => updateStudent("courseName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select value={String(student.semester)} onValueChange={(v) => updateStudent("semester", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Semester {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">Academic Year *</Label>
              <Input id="year" placeholder="2025-26" value={student.academicYear} onChange={(e) => updateStudent("academicYear", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Subjects</CardTitle>
            <Button size="sm" variant="outline" onClick={addSubject} className="gap-1 hover:scale-105 transition-transform">
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="hidden md:grid grid-cols-[1fr_120px_120px_80px_40px] gap-3 text-xs font-medium text-muted-foreground px-1">
              <span>Subject Name</span><span>Max Marks</span><span>Obtained</span><span>Status</span><span />
            </div>
            {subjects.map((sub, i) => {
              const invalid = sub.name.trim() && sub.marksObtained > sub.maxMarks;
              const pass = sub.name.trim() && sub.maxMarks > 0 ? isSubjectPass(sub) : null;
              return (
                <div key={sub.id} className={cn("grid grid-cols-1 md:grid-cols-[1fr_120px_120px_80px_40px] gap-3 items-center p-3 rounded-lg border transition-all duration-200 hover:shadow-sm", invalid ? "border-destructive bg-red-50/50" : "border-border")}>
                  <Input placeholder={`Subject ${i + 1}`} value={sub.name} onChange={(e) => updateSubject(sub.id, "name", e.target.value)} />
                  <Input type="number" min={1} value={sub.maxMarks} onChange={(e) => updateSubject(sub.id, "maxMarks", Math.max(1, Number(e.target.value)))} />
                  <Input type="number" min={0} max={sub.maxMarks} value={sub.marksObtained} className={cn(invalid && "border-destructive")} onChange={(e) => updateSubject(sub.id, "marksObtained", Math.max(0, Number(e.target.value)))} />
                  <div className="text-center text-sm font-medium">
                    {pass === null ? <span className="text-muted-foreground">—</span> : pass ? <span className="text-emerald-600">Pass</span> : <span className="text-red-500">Fail</span>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeSubject(sub.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Live Summary */}
        <Card className={cn("shadow-lg border-2 transition-all duration-300", status ? getStatusBg(status) : "")}>
          <CardHeader>
            <CardTitle className="text-lg">Live Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Marks</span>
              <span className="font-semibold">{totalObtained} / {totalMax}</span>
            </div>
            <Progress value={percentage} className="h-3" />
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{percentage.toFixed(1)}%</span>
              {status && (
                <span className={cn("text-lg font-bold px-3 py-1 rounded-full", getStatusColor(status))}>
                  {status}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full text-base font-semibold hover:scale-[1.02] transition-transform duration-200" disabled={!isFormValid} onClick={handleGenerate}>
          Generate Result Sheet
        </Button>
      </main>
    </div>
  );
};

export default Index;
