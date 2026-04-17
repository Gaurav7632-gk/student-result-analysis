import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Save, GraduationCap, CheckCircle, Award, Mail } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useEffect, useState } from "react";
import { getSubmissions, emailPdf } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResultData } from "@/types/result";
import { calculatePercentage, getResultStatus, isSubjectPass, getStatusColor } from "@/lib/result-utils";
import { saveResult, saveResultRemote } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { generatePDF } from "@/lib/pdf-generator";
import EmailModal from "@/components/EmailModal";

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const result = location.state as ResultData | undefined;

  if (!result) {
    navigate("/");
    return null;
  }

  const { student, subjects } = result;
  const percentage = calculatePercentage(subjects);
  const status = getResultStatus(percentage, subjects);
  const totalObtained = subjects.reduce((s, sub) => s + sub.marksObtained, 0);
  const totalMax = subjects.reduce((s, sub) => s + sub.maxMarks, 0);

  const chartData = subjects.map((s) => ({
    name: s.name,
    obtained: s.marksObtained,
    max: s.maxMarks,
  }));

  // Student-level additional charts data
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const q = student.rollNumber || student.registrationNumber || student.name;
        if (!q) return;
        const rows = await getSubmissions({ q: String(q), limit: 500 });
        setStudentHistory(rows || []);
      } catch (e) {
        // ignore
      }
    })();
  }, [student]);

  const totalObtainedForPie = totalObtained || 1;
  const pieData = subjects.map((s) => ({ name: s.name, value: Number(((s.marksObtained / totalObtainedForPie) * 100).toFixed(2)) }));

  // Semester trend: compute average percentage per semester from studentHistory
  const semesterMap: Record<string, { sum: number; count: number }> = {};
  for (const sub of studentHistory) {
    const sem = (sub.student && (sub.student.semester || sub.student.semester === 0)) ? String(sub.student.semester) : String(sub.data?.student?.semester || "0");
    const perc = sub.subjects ? Number(calculatePercentage(sub.subjects)) : 0;
    if (!semesterMap[sem]) semesterMap[sem] = { sum: 0, count: 0 };
    semesterMap[sem].sum += perc;
    semesterMap[sem].count += 1;
  }
  const semesterTrend = Object.keys(semesterMap)
    .map((k) => ({ semester: k, avg: Number((semesterMap[k].sum / semesterMap[k].count).toFixed(2)) }))
    .sort((a, b) => Number(a.semester) - Number(b.semester));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveResultRemote(result);
      saveResult(result);
      if (res.ok) {
        toast({ 
          title: "✅ Saved Successfully!", 
          description: "Result saved to server and local history." 
        });
      } else {
        toast({ 
          title: "✓ Saved Locally", 
          description: "Server save failed; saved to history locally." 
        });
      }
    } catch (e) {
      saveResult(result);
      toast({ 
        title: "⚠️ Saved Locally", 
        description: "Result saved to your local history." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      await generatePDF(result);
    } catch (e) {
      console.error("PDF generation failed", e);
    }
  };

  const handleEmail = () => {
    setEmailModalOpen(true);
  };

  /** Called by EmailModal with the confirmed address */
  const handleSendEmail = async (toEmail: string): Promise<void> => {
    // Prefer server-side email-now endpoint (no DB save required)
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = localStorage.getItem("auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/email-now`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        result,
        email: toEmail,
        subject: `Your Result — ${student.name} | Semester ${student.semester}`,
      }),
    });

    if (resp.ok) {
      return; // success — modal will show the success state
    }

    // Server failed — attempt client-side PDF upload fallback
    let serverErr = '';
    try {
      const errJson = await resp.json();
      serverErr = errJson?.error || errJson?.hint || JSON.stringify(errJson);
    } catch {
      serverErr = `HTTP ${resp.status}`;
    }

    // Try client generate + upload fallback
    try {
      const blob = await generatePDF(result, { download: false });
      if (blob) {
        const file = blob instanceof File
          ? blob
          : new File([blob], `${student.name.replace(/\s+/g, "_")}_Sem${student.semester}_Result.pdf`, { type: "application/pdf" });
        const uploadResp = await emailPdf(file, toEmail, `Result - ${student.name}`);
        if (uploadResp?.ok) return;
        serverErr = uploadResp?.data?.error || uploadResp?.data?.hint || serverErr;
      }
    } catch (fallbackErr) {
      // ignore fallback errors, throw original
    }

    throw new Error(serverErr || 'Server returned an error. Check backend logs.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <EmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        defaultEmail={student.email || ""}
        studentName={student.name}
        onSend={handleSendEmail}
      />
      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 border-b border-white/20 glass backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/")} 
            className="gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Edit
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave} 
              className="gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleEmail}
              className="gap-2 rounded-xl btn-enhanced-secondary text-sm hover:shadow-lg hover:-translate-y-0.5"
            >
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button 
              size="sm" 
              onClick={handleDownload} 
              className="gap-2 rounded-xl btn-enhanced-primary text-sm hover:shadow-lg hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 animate-slideUp">
        <Card className="card-enhanced overflow-hidden shadow-2xl" id="result-sheet">
          <CardContent className="p-0">
            {/* Enhanced Marksheet Header with Gradient */}
            <div className="bg-gradient-to-r from-primary via-purple-600 to-secondary text-white p-10 text-center space-y-3 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 right-2 text-6xl">🎓</div>
              </div>
              <div className="relative">
                <div className="inline-block p-4 rounded-2xl bg-white/10 backdrop-blur-sm mb-2">
                  <GraduationCap className="h-8 w-8 mx-auto" />
                </div>
                <h2 className="text-3xl font-bold tracking-wide uppercase">{student.universityName}</h2>
                <p className="text-base opacity-90 font-medium">📋 Statement of Marks</p>
                <p className="text-sm opacity-80">{student.courseName} | 🎓 Semester {student.semester} • {student.academicYear}</p>
              </div>
            </div>

            {/* Student Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">👤 Student Name</p>
                <p className="text-lg font-bold text-foreground">{student.name}</p>
              </div>
              {student.rollNumber && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">📍 Roll Number</p>
                  <p className="text-lg font-bold text-foreground">{student.rollNumber}</p>
                </div>
              )}
              {student.registrationNumber && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">🔐 Registration</p>
                  <p className="text-lg font-bold text-foreground">{student.registrationNumber}</p>
                </div>
              )}
            </div>

            {/* Marks Table */}
            <div className="p-8">
              <div className="rounded-xl overflow-hidden border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20">
                      <TableHead className="w-12 font-bold text-foreground">#</TableHead>
                      <TableHead className="font-bold text-foreground">📚 Subject</TableHead>
                      <TableHead className="text-center font-bold text-foreground w-24">📊 Max</TableHead>
                      <TableHead className="text-center font-bold text-foreground w-24">✏️ Obtained</TableHead>
                      <TableHead className="text-center font-bold text-foreground w-20">📈 Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((sub, i) => {
                      const pass = isSubjectPass(sub);
                      return (
                        <TableRow 
                          key={sub.id}
                          className="border-b border-border/30 hover:bg-primary/5 transition-colors"
                        >
                          <TableCell className="font-bold text-muted-foreground bg-muted/30">{i + 1}</TableCell>
                          <TableCell className="font-semibold text-foreground">{sub.name}</TableCell>
                          <TableCell className="text-center font-semibold">{sub.maxMarks}</TableCell>
                          <TableCell className="text-center font-bold text-lg">{sub.marksObtained}</TableCell>
                          <TableCell className={cn("text-center font-bold text-sm", pass ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            {pass ? (
                              <div className="flex items-center justify-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                <span>Pass</span>
                              </div>
                            ) : (
                              <span>✗ Fail</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gradient-to-r from-primary/5 to-secondary/5 border-t-2 border-primary/30 font-bold">
                      <TableCell />
                      <TableCell className="text-foreground">Total</TableCell>
                      <TableCell className="text-center text-foreground text-lg">{totalMax}</TableCell>
                      <TableCell className="text-center text-foreground text-lg">{totalObtained}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Per-student Chart: Subject vs Marks */}
            <div className="p-8 border-t border-border/30">
              <h3 className="text-lg font-bold mb-3">Subject-wise Marks</h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="obtained" fill="#4F46E5" name="Obtained" />
                    <Bar dataKey="max" fill="#06B6D4" name="Max" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Small charts: Pie (subject % distribution) and Semester trend (line) */}
            <div className="p-8 border-t border-border/30 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-bold mb-3">Subject Percentage Distribution</h4>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#4F46E5", "#06B6D4", "#F97316", "#10B981", "#EF4444", "#8B5CF6"][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3">Semester Performance (History)</h4>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={semesterTrend} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semester" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="avg" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Footer / Summary Section */}
            <div className="border-t border-primary/10 p-8 space-y-6 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Percentage */}
                <div className="card-enhanced p-6 text-center space-y-2">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Overall Percentage</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {percentage.toFixed(2)}%
                  </p>
                </div>

                {/* Status Badge */}
                <div className={cn(
                  "card-enhanced p-6 text-center space-y-2 flex flex-col items-center justify-center rounded-xl",
                  status === "Pass" && "from-green-100/50 to-emerald-100/50 dark:from-green-950/30 dark:to-emerald-950/30",
                  status === "Fail" && "from-red-100/50 to-rose-100/50 dark:from-red-950/30 dark:to-rose-950/30",
                  status === "Distinction" && "from-purple-100/50 to-pink-100/50 dark:from-purple-950/30 dark:to-pink-950/30",
                )}>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Result Status</p>
                  <div className="flex items-center gap-2 text-2xl font-bold justify-center">
                    {status === "Pass" && <CheckCircle className="h-6 w-6 text-green-600" />}
                    {status === "Distinction" && <Award className="h-6 w-6 text-purple-600" />}
                    <span className={cn(
                      status === "Pass" && "text-green-700 dark:text-green-400",
                      status === "Fail" && "text-red-700 dark:text-red-400",
                      status === "Distinction" && "text-purple-700 dark:text-purple-400",
                    )}>
                      {status}
                    </span>
                  </div>
                </div>

                {/* Grade Info */}
                <div className="card-enhanced p-6 text-center space-y-2">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Marks Summary</p>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{totalObtained}/{totalMax}</span></p>
                    <p className="text-sm text-muted-foreground">Percentage: <span className="font-bold text-foreground">{percentage.toFixed(1)}%</span></p>
                  </div>
                </div>
              </div>

              {/* Footer Text */}
              <div className="text-center pt-4 border-t border-border/30 space-y-1">
                <p className="text-xs text-muted-foreground">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="text-xs text-muted-foreground">UniResult - Smart Result Sheet Generator</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Preview;

