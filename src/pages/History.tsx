import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Eye, GraduationCap, FileX } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--accent))] via-background to-[hsl(var(--secondary))]">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-lg font-bold">Saved Results</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <FileX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-muted-foreground">No saved results</h2>
            <p className="text-sm text-muted-foreground">Generate and save a result to see it here.</p>
            <Button variant="outline" onClick={() => navigate("/")}>Create Result</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((r) => {
              const pct = calculatePercentage(r.subjects);
              const status = getResultStatus(pct, r.subjects);
              return (
                <Card key={r.id} className="shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
                  <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{r.student.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {r.student.courseName} — Sem {r.student.semester}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold text-lg", getStatusColor(status))}>
                        {pct.toFixed(1)}%
                      </span>
                      <Button size="sm" variant="outline" onClick={() => navigate("/preview", { state: r })} className="gap-1">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
