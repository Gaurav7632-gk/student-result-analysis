import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Download, Save, GraduationCap, CheckCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResultData } from "@/types/result";
import { calculatePercentage, getResultStatus, isSubjectPass, getStatusColor } from "@/lib/result-utils";
import { saveResult, saveResultRemote } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { generatePDF } from "@/lib/pdf-generator";

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
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

  const handleDownload = () => {
    generatePDF(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
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

