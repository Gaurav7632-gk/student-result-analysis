import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Download, Save, GraduationCap } from "lucide-react";
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
      // Try remote save first, fall back to local storage
      const res = await saveResultRemote(result);
      saveResult(result);
      if (res.ok) {
        toast({ title: "Saved!", description: "Result saved to server and history." });
      } else {
        toast({ title: "Saved locally", description: "Server save failed; saved to history locally." });
      }
    } catch (e) {
      saveResult(result);
      toast({ title: "Error", description: "Unexpected error while saving; saved locally." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    generatePDF(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--accent))] via-background to-[hsl(var(--secondary))]">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Edit
          </Button>
            <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} className="gap-2 hover:scale-105 transition-transform" disabled={isSaving}>
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <><Save className="h-4 w-4" /> Save</>
              )}
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-2 hover:scale-105 transition-transform">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <Card className="shadow-2xl overflow-hidden" id="result-sheet">
          <CardContent className="p-0">
            {/* Marksheet Header */}
            <div className="bg-primary text-primary-foreground p-8 text-center space-y-2">
              <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-80" />
              <h2 className="text-2xl font-bold tracking-wide uppercase">{student.universityName}</h2>
              <p className="text-sm opacity-80">Statement of Marks — {student.courseName}</p>
              <p className="text-xs opacity-70">Semester {student.semester} • Academic Year {student.academicYear}</p>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{student.name}</span></div>
              {student.rollNumber && <div><span className="text-muted-foreground">Roll No:</span> <span className="font-medium">{student.rollNumber}</span></div>}
              {student.registrationNumber && <div><span className="text-muted-foreground">Reg No:</span> <span className="font-medium">{student.registrationNumber}</span></div>}
            </div>

            {/* Marks Table */}
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center w-24">Max Marks</TableHead>
                    <TableHead className="text-center w-24">Obtained</TableHead>
                    <TableHead className="text-center w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((sub, i) => {
                    const pass = isSubjectPass(sub);
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell className="text-center">{sub.maxMarks}</TableCell>
                        <TableCell className="text-center font-semibold">{sub.marksObtained}</TableCell>
                        <TableCell className={cn("text-center font-semibold", pass ? "text-emerald-600" : "text-red-500")}>
                          {pass ? "Pass" : "Fail"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell />
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">{totalMax}</TableCell>
                    <TableCell className="text-center">{totalObtained}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            <div className="border-t p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-3xl font-bold">{percentage.toFixed(2)}%</p>
              </div>
              <div className={cn("text-center px-6 py-3 rounded-xl font-bold text-xl", getStatusColor(status))}>
                {status}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Preview;
