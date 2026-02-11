import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Eye, GraduationCap, FileX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResultData } from "@/types/result";
import { getSavedResults, deleteResult } from "@/lib/storage";
import { calculatePercentage, getResultStatus, getStatusColor } from "@/lib/result-utils";
import { cn } from "@/lib/utils";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ResultData[]>([]);

  useEffect(() => {
    setResults(getSavedResults());
  }, []);

  const handleDelete = (id: string) => {
    deleteResult(id);
    setResults(getSavedResults());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 border-b border-white/20 glass backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/")} 
            className="gap-2 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">📋 Saved Results</h1>
            <p className="text-xs text-muted-foreground font-medium">{results.length} result{results.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 animate-slideUp">
        {results.length === 0 ? (
          <div className="card-enhanced p-12 text-center space-y-6">
            <div className="h-24 w-24 rounded-full icon-wrapper-primary mx-auto">
              <FileX className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">No Saved Results Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Generate and save your first result sheet to see it appear here. It's quick, easy, and beautifully designed!</p>
            </div>
            <Button 
              onClick={() => navigate("/")}
              className="btn-enhanced-primary gap-2 mx-auto hover:shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
              Create Your First Result
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((result, idx) => {
              const pct = calculatePercentage(result.subjects);
              const status = getResultStatus(pct, result.subjects);
              const createdDate = new Date(result.createdAt);
              
              return (
                <Card 
                  key={result.id} 
                  className="card-enhanced overflow-hidden transition-all duration-300 hover:shadow-xl"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left: Student Info */}
                      <div className="flex items-start sm:items-center gap-4 flex-1">
                        <div className="hidden sm:block h-14 w-14 rounded-xl icon-wrapper-primary flex-shrink-0">
                          <GraduationCap className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-foreground">{result.student.name}</h3>
                            <span className="text-xs font-semibold badge-info px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              {result.student.courseName}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Semester {result.student.semester} • {result.student.universityName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>📅 {createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>🕐 {createdDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Percentage & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <div className="text-right space-y-1">
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Percentage</p>
                          <p className={cn(
                            "text-2xl font-bold",
                            status === "Distinction" && "text-purple-600 dark:text-purple-400",
                            status === "Pass" && "text-green-600 dark:text-green-400",
                            status === "Fail" && "text-red-600 dark:text-red-400",
                          )}>
                            {pct.toFixed(1)}%
                          </p>
                          <p className={cn(
                            "text-xs font-bold px-2 py-1 rounded-lg w-fit ml-auto",
                            status === "Distinction" && "badge-info text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40",
                            status === "Pass" && "badge-success text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40",
                            status === "Fail" && "badge-danger text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40",
                          )}>
                            {status}
                          </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate("/preview", { state: result })} 
                            className="gap-1.5 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all h-10"
                          >
                            <Eye className="h-4 w-4" /> 
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDelete(result.id)} 
                            className="text-muted-foreground hover:text-destructive hover:bg-red-100/50 dark:hover:bg-red-950/30 rounded-lg transition-all h-10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar showing marks */}
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Marks: {result.subjects.reduce((s, sub) => s + sub.marksObtained, 0)}/{result.subjects.reduce((s, sub) => s + sub.maxMarks, 0)}</span>
                        <span>{result.subjects.length} subject{result.subjects.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                          style={{ 
                            width: `${(result.subjects.reduce((s, sub) => s + sub.marksObtained, 0) / result.subjects.reduce((s, sub) => s + sub.maxMarks, 0)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
