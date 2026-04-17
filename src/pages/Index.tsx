import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Plus, Trash2, FileText, History, Zap, CheckCircle, AlertCircle, Sparkles, Building2, BookA, AtSign, BookOpen, User, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Subject, StudentInfo } from "@/types/result";
import { createSubject, calculatePercentage, getResultStatus, isSubjectPass } from "@/lib/result-utils";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const defaultSubjects = (): Subject[] =>
  Array.from({ length: 5 }, () => createSubject());

const SUBJECT_PLACEHOLDERS = [
  "Data Structures", 
  "Operating Systems", 
  "Computer Networks", 
  "Database Management", 
  "Software Engineering", 
  "Discrete Mathematics"
];

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
    email: "",
  });
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects());
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateStudent = (field: keyof StudentInfo, value: string | number) => {
    setStudent((prev) => ({ ...prev, [field]: value }));
  };

  const updateTextOnly = (field: keyof StudentInfo, value: string) => {
    updateStudent(field, value.replace(/[^a-zA-Z\s]/g, ""));
  };

  const updateCourseText = (field: keyof StudentInfo, value: string) => {
    updateStudent(field, value.replace(/[^a-zA-Z\s.]/g, ""));
  };

  const updateNumberOnly = (field: keyof StudentInfo, value: string) => {
    updateStudent(field, value.replace(/\D/g, ""));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getError = (field: string) => {
    if (!touched[field]) return null;
    
    switch (field) {
      case "name":
        return student.name.trim().length < 3 ? "Name must be at least 3 characters" : null;
      case "email":
        return student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email) ? "Invalid email format" : null;
      case "universityName":
        return !student.universityName.trim() ? "Institution name is required" : null;
      case "courseName":
        return !student.courseName.trim() ? "Course program is required" : null;
      case "academicYear":
        return !student.academicYear.trim() ? "Academic session is required" : null;
      default:
        return null;
    }
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
    student.name.trim().length >= 3 &&
    student.universityName.trim() &&
    student.courseName.trim() &&
    student.academicYear.trim() &&
    (student.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email) : true) &&
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans selection:bg-neutral-800 selection:text-white dark:selection:bg-neutral-200 dark:selection:text-neutral-900 pb-20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 p-2 rounded-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">University Result Portal</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/history")} 
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            <History className="h-4 w-4 mr-2" />
            Records
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 space-y-12">
        {/* Header Section */}
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400">
            Create an academic result record
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Fill out the student details and subject marks. A unified, perfectly scaled PDF will be generated instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Form Section - Takes up 8 cols on large screens */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Student Details Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-500 border-neutral-200/60 dark:border-neutral-800 rounded-2xl bg-white/50 backdrop-blur-xl dark:bg-neutral-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium tracking-tight flex items-center gap-2">
                  <User className="h-5 w-5 text-neutral-400" />
                  Student Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <Input 
                        id="name" placeholder="Rahul Sharma" 
                        value={student.name} 
                        onChange={(e) => updateTextOnly("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                        className={cn("pl-9 bg-neutral-50/50 dark:bg-neutral-950 shadow-none h-10", getError("name") ? "border-red-500 focus-visible:ring-red-500" : "border-neutral-200 dark:border-neutral-800 focus-visible:ring-neutral-900")}
                      />
                    </div>
                    {getError("name") && <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">{getError("name")}</p>}
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <Input 
                        id="email" type="email" placeholder="rahul@example.com"
                        value={student.email || ""} 
                        onChange={(e) => updateStudent("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        className={cn("pl-9 bg-neutral-50/50 dark:bg-neutral-950 shadow-none h-10", getError("email") ? "border-red-500 focus-visible:ring-red-500" : "border-neutral-200 dark:border-neutral-800 focus-visible:ring-neutral-900")}
                      />
                    </div>
                    {getError("email") && <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">{getError("email")}</p>}
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-2">
                    <Label htmlFor="roll" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Roll Number
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <Input 
                        id="roll" placeholder="102938" 
                        value={student.rollNumber} onChange={(e) => updateNumberOnly("rollNumber", e.target.value)}
                        className="pl-9 bg-neutral-50/50 border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 focus-visible:ring-neutral-900 shadow-none h-10"
                      />
                    </div>
                  </div>

                  {/* Registration Number */}
                  <div className="space-y-2">
                    <Label htmlFor="reg" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Registration Number
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <Input 
                        id="reg" placeholder="24001928" 
                        value={student.registrationNumber} onChange={(e) => updateNumberOnly("registrationNumber", e.target.value)}
                        className="pl-9 bg-neutral-50/50 border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 focus-visible:ring-neutral-900 shadow-none h-10"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-neutral-100 dark:bg-neutral-800" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* University */}
                  <div className="space-y-2">
                    <Label htmlFor="uni" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Institution Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <Input 
                        id="uni" placeholder="Delhi University" 
                        value={student.universityName} 
                        onChange={(e) => updateTextOnly("universityName", e.target.value)}
                        onBlur={() => handleBlur("universityName")}
                        className={cn("pl-9 bg-neutral-50/50 dark:bg-neutral-950 shadow-none h-10", getError("universityName") ? "border-red-500 focus-visible:ring-red-500" : "border-neutral-200 dark:border-neutral-800 focus-visible:ring-neutral-900")}
                      />
                    </div>
                    {getError("universityName") && <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">{getError("universityName")}</p>}
                  </div>

                  {/* Course */}
                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Degree / Program <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <Input 
                        id="course" placeholder="B.Tech Computer Science" 
                        value={student.courseName} 
                        onChange={(e) => updateCourseText("courseName", e.target.value)}
                        onBlur={() => handleBlur("courseName")}
                        className={cn("pl-9 bg-neutral-50/50 dark:bg-neutral-950 shadow-none h-10", getError("courseName") ? "border-red-500 focus-visible:ring-red-500" : "border-neutral-200 dark:border-neutral-800 focus-visible:ring-neutral-900")}
                      />
                    </div>
                    {getError("courseName") && <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">{getError("courseName")}</p>}
                  </div>
                  
                  {/* Semester */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Semester</Label>
                    <Select value={String(student.semester)} onValueChange={(v) => updateStudent("semester", Number(v))}>
                      <SelectTrigger className="bg-neutral-50/50 border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 shadow-none h-10 focus:ring-neutral-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>Semester {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Academic Session <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <Input 
                        id="year" placeholder="2025-2026" 
                        value={student.academicYear} 
                        onChange={(e) => updateStudent("academicYear", e.target.value)}
                        onBlur={() => handleBlur("academicYear")}
                        className={cn("pl-9 bg-neutral-50/50 dark:bg-neutral-950 shadow-none h-10", getError("academicYear") ? "border-red-500 focus-visible:ring-red-500" : "border-neutral-200 dark:border-neutral-800 focus-visible:ring-neutral-900")}
                      />
                    </div>
                    {getError("academicYear") && <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">{getError("academicYear")}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Record Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-500 border-neutral-200/60 dark:border-neutral-800 rounded-2xl bg-white/50 backdrop-blur-xl dark:bg-neutral-900/50">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-medium tracking-tight flex items-center gap-2">
                    <BookA className="h-5 w-5 text-neutral-400" />
                    Academic Record
                  </CardTitle>
                </div>
                <Button 
                  size="sm" variant="outline" onClick={addSubject} 
                  className="rounded-md border-neutral-200 shadow-none hover:bg-neutral-100 h-8 text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Subject
                </Button>
              </CardHeader>
              <CardContent>
                <div className="hidden md:grid grid-cols-[1fr_90px_90px_80px_40px] gap-4 mb-3 px-1">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Subject Title</span>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center">Max Marks</span>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center">Obtained</span>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center">Status</span>
                  <span />
                </div>
                
                <div className="space-y-3">
                  {subjects.map((sub, i) => {
                    const isNameInvalid = touched[`sub_name_${sub.id}`] && !sub.name.trim();
                    const invalidMarks = touched[`sub_marks_${sub.id}`] && sub.marksObtained > sub.maxMarks;
                    const pass = sub.name.trim() && sub.maxMarks > 0 ? isSubjectPass(sub) : null;
                    const placeholderText = SUBJECT_PLACEHOLDERS[i % SUBJECT_PLACEHOLDERS.length];
                    
                    return (
                      <div key={sub.id} className="space-y-1">
                        <div 
                          className={cn(
                            "grid grid-cols-1 md:grid-cols-[1fr_90px_90px_80px_40px] gap-4 items-center pl-3 pr-2 py-2 rounded-lg border hover:shadow-sm transition-shadow duration-300",
                            invalidMarks || isNameInvalid ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20" : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-neutral-400 w-4">{i + 1}.</span>
                            <Input 
                              placeholder={placeholderText}
                              value={sub.name} 
                              onChange={(e) => updateSubject(sub.id, "name", e.target.value.replace(/[^a-zA-Z\s.-]/g, ""))}
                              onBlur={() => handleBlur(`sub_name_${sub.id}`)}
                              className={cn("bg-transparent border-none shadow-none h-8 px-1 focus-visible:ring-0 text-sm font-medium p-0", isNameInvalid && "placeholder:text-red-400")}
                            />
                          </div>
                          <Input 
                            type="number" min={1} 
                            value={sub.maxMarks || ""} 
                            onChange={(e) => updateSubject(sub.id, "maxMarks", Math.max(1, parseInt(e.target.value) || 0))}
                            className="bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 shadow-none h-8 focus-visible:ring-neutral-900 text-sm text-center"
                          />
                          <Input 
                            type="number" min={0} max={sub.maxMarks} 
                            value={sub.marksObtained || ""} 
                            onBlur={() => handleBlur(`sub_marks_${sub.id}`)}
                            className={cn("bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 shadow-none h-8 focus-visible:ring-neutral-900 text-sm text-center font-medium", invalidMarks && "text-red-600 border-red-300")}
                            onChange={(e) => updateSubject(sub.id, "marksObtained", Math.max(0, parseInt(e.target.value) || 0))}
                          />
                          <div className="flex justify-center">
                            {pass === null ? (
                              <span className="text-xs text-neutral-300">—</span>
                            ) : pass ? (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">Pass</span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">Fail</span>
                            )}
                          </div>
                          <Button 
                            size="icon" variant="ghost" 
                            onClick={() => removeSubject(sub.id)} 
                            className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {invalidMarks && <p className="text-[10px] text-red-500 font-medium pl-8 animate-in fade-in">Marks obtained cannot exceed max marks</p>}
                        {isNameInvalid && <p className="text-[10px] text-red-500 font-medium pl-8 animate-in fade-in">Subject name is required</p>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Live Summary - Takes up 4 cols on large screens */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <Card className="shadow-lg border-neutral-200/60 dark:border-neutral-800 rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-neutral-900/80 overflow-hidden transition-all duration-500">
              <div className={cn(
                "h-2 w-full",
                status === "Pass" || status === "Distinction" ? "bg-green-500" : status === "Fail" ? "bg-red-500" : "bg-neutral-200 dark:bg-neutral-800"
              )} />
              
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold tracking-widest text-neutral-500 uppercase flex flex-col gap-2">
                  Live Snapshot
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <div className="flex flex-col gap-1">
                  <span className="text-4xl font-light tracking-tight text-neutral-900 dark:text-white">
                    {percentage.toFixed(1)}<span className="text-2xl text-neutral-400">%</span>
                  </span>
                  <span className="text-sm text-neutral-500">Aggregate Score</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Total Marks</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{totalObtained} <span className="text-neutral-400 font-normal">/ {totalMax}</span></span>
                  </div>
                  <Progress value={percentage || 0} className={cn("h-1.5", status === 'Fail' ? '[&>div]:bg-red-500' : '[&>div]:bg-neutral-900 dark:[&>div]:bg-white')} />
                </div>

                <div className="flex justify-between items-center py-4 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-sm text-neutral-500">Verdict</span>
                  {status ? (
                    <span className={cn(
                      "text-sm font-semibold tracking-wide",
                      (status === "Pass" || status === "Distinction") ? "text-green-600" : "text-red-600"
                    )}>
                      {status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-300">PENDING</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              disabled={!isFormValid} 
              onClick={handleGenerate}
              className="w-full rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white shadow-xl shadow-neutral-900/20 dark:shadow-white/10 h-14 font-semibold tracking-wide transition-all data-[disabled]:opacity-50 data-[disabled]:shadow-none hover:-translate-y-0.5"
            >
              Generate Result Document
              <Sparkles className="h-4 w-4 ml-2 opacity-50" />
            </Button>
            
            <p className="text-xs text-center text-neutral-400 font-medium">
              {!isFormValid ? "Fill in all required fields correctly to unlock" : "PDF formatting is automatically applied"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
