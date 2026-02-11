import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Plus, Trash2, FileText, History, Zap, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      {/* Enhanced Header with Glassmorphism */}
      <header className="sticky top-0 z-20 border-b border-white/20 glass backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl icon-wrapper-primary shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Student Marks Analysis</h1>
              <p className="text-sm text-muted-foreground font-medium">Smart Result Sheet Generator</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/history")} 
            className="gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <History className="h-4 w-4" /> History
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8 animate-slideUp">
        {/* Welcome Info Card */}
        <div className="card-enhanced p-6 border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Welcome to Student Marks Analysis!</h2>
              <p className="text-sm text-muted-foreground mt-1">Generate beautiful, professional result sheets in seconds. Fill in your details below and watch the magic happen!</p>
            </div>
          </div>
        </div>

        {/* Student Details Card */}
        <Card className="card-enhanced overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="icon-wrapper-primary">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">👤 Student Information</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Complete your academic details to get started</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-1">
                  <span className="text-primary">*</span> Full Name
                </Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={student.name} 
                  onChange={(e) => updateStudent("name", e.target.value)}
                  className="input-enhanced text-sm"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="roll" className="text-sm font-semibold">Roll Number</Label>
                <Input 
                  id="roll" 
                  placeholder="2024001" 
                  value={student.rollNumber} 
                  onChange={(e) => updateStudent("rollNumber", e.target.value)}
                  className="input-enhanced text-sm"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="reg" className="text-sm font-semibold">Registration Number</Label>
                <Input 
                  id="reg" 
                  placeholder="REG-2024-001" 
                  value={student.registrationNumber} 
                  onChange={(e) => updateStudent("registrationNumber", e.target.value)}
                  className="input-enhanced text-sm"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="uni" className="text-sm font-semibold flex items-center gap-1">
                  <span className="text-primary">*</span> University / College
                </Label>
                <Input 
                  id="uni" 
                  placeholder="State University" 
                  value={student.universityName} 
                  onChange={(e) => updateStudent("universityName", e.target.value)}
                  className="input-enhanced text-sm"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="course" className="text-sm font-semibold flex items-center gap-1">
                  <span className="text-primary">*</span> Course Name
                </Label>
                <Input 
                  id="course" 
                  placeholder="B.Tech CSE" 
                  value={student.courseName} 
                  onChange={(e) => updateStudent("courseName", e.target.value)}
                  className="input-enhanced text-sm"
                />
              </div>

              <div className="space-y-2.5">
                <Label className="text-sm font-semibold">Semester</Label>
                <Select value={String(student.semester)} onValueChange={(v) => updateStudent("semester", Number(v))}>
                  <SelectTrigger className="input-enhanced">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Semester {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="year" className="text-sm font-semibold flex items-center gap-1">
                  <span className="text-primary">*</span> Academic Year
                </Label>
                <Input 
                  id="year" 
                  placeholder="2025-26" 
                  value={student.academicYear} 
                  onChange={(e) => updateStudent("academicYear", e.target.value)}
                  className="input-enhanced text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Card */}
        <Card className="card-enhanced overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-secondary/5 to-emerald-500/5 border-b border-secondary/10 pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-wrapper-success">
                <Zap className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">📚 Subjects & Marks</CardTitle>
            </div>
            <Button 
              size="sm" 
              onClick={addSubject} 
              className="gap-1.5 btn-enhanced-secondary hover:shadow-lg text-sm"
            >
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="hidden md:grid grid-cols-[2fr_120px_120px_100px_40px] gap-3 text-xs font-bold text-muted-foreground px-2 pb-4 mb-4 border-b border-border/50">
              <span>📖 Subject Name</span>
              <span className="text-center">📊 Max Marks</span>
              <span className="text-center">✏️ Obtained</span>
              <span className="text-center">📈 Status</span>
              <span />
            </div>
            <div className="space-y-3">
              {subjects.map((sub, i) => {
                const invalid = sub.name.trim() && sub.marksObtained > sub.maxMarks;
                const pass = sub.name.trim() && sub.maxMarks > 0 ? isSubjectPass(sub) : null;
                return (
                  <div 
                    key={sub.id} 
                    className={cn(
                      "grid grid-cols-1 md:grid-cols-[2fr_120px_120px_100px_40px] gap-3 items-center p-4 rounded-xl border-2 transition-all duration-300",
                      invalid 
                        ? "border-destructive/50 bg-red-50/30 dark:bg-red-950/10" 
                        : "border-border/60 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-lg">{i + 1}</span>
                      <Input 
                        placeholder={`Subject ${i + 1}`} 
                        value={sub.name} 
                        onChange={(e) => updateSubject(sub.id, "name", e.target.value)}
                        className="input-enhanced text-sm"
                      />
                    </div>
                    <Input 
                      type="number" 
                      min={1} 
                      value={sub.maxMarks} 
                      onChange={(e) => updateSubject(sub.id, "maxMarks", Math.max(1, Number(e.target.value)))}
                      className="input-enhanced text-sm text-center"
                    />
                    <Input 
                      type="number" 
                      min={0} 
                      max={sub.maxMarks} 
                      value={sub.marksObtained} 
                      className={cn("input-enhanced text-sm text-center", invalid && "border-destructive")}
                      onChange={(e) => updateSubject(sub.id, "marksObtained", Math.max(0, Number(e.target.value)))}
                    />
                    <div className="text-center">
                      {pass === null ? (
                        <span className="text-xs text-muted-foreground font-medium">—</span>
                      ) : pass ? (
                        <div className="flex items-center justify-center gap-1 badge-success px-3 py-1.5 rounded-lg w-fit mx-auto">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">Pass</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 badge-danger px-3 py-1.5 rounded-lg w-fit mx-auto">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">Fail</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => removeSubject(sub.id)} 
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-red-100/50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Summary Card with Enhanced Design */}
        <Card className={cn(
          "card-enhanced overflow-hidden border-2 transition-all duration-300",
          status === "Pass" && "border-green-500/50 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20",
          status === "Fail" && "border-red-500/50 bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/20",
          status === "Distinction" && "border-purple-500/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20",
          !status && "border-blue-500/30"
        )}>
          <CardHeader className="pb-4 border-b border-current/10">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary animate-pulse-soft" />
              <CardTitle className="text-lg">⚡ Live Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Marks Info */}
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Total Marks</p>
                  <p className="text-3xl font-bold text-foreground">{totalObtained}/{totalMax}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Performance</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <Progress value={percentage} className="h-3 rounded-full" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Status Badge */}
              {status && (
                <div className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-lg w-fit mx-auto",
                  status === "Pass" && "badge-success",
                  status === "Fail" && "badge-danger",
                  status === "Distinction" && "badge-info"
                )}>
                  {status === "Pass" && <CheckCircle className="h-5 w-5" />}
                  {status === "Fail" && <AlertCircle className="h-5 w-5" />}
                  {status === "Distinction" && <Sparkles className="h-5 w-5" />}
                  <span>{status.toUpperCase()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button 
          size="lg" 
          className="w-full text-base font-bold h-14 rounded-xl btn-enhanced-primary hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed gap-2"
          disabled={!isFormValid} 
          onClick={handleGenerate}
        >
          <Sparkles className="h-5 w-5" />
          Generate Result Sheet
          <Sparkles className="h-5 w-5" />
        </Button>
      </main>
    </div>
  );
};

export default Index;
