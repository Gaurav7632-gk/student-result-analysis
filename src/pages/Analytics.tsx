import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAnalytics, getToppers } from "@/lib/storage";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#4F46E5", "#06B6D4", "#F97316", "#10B981", "#EF4444", "#8B5CF6"];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [toppers, setToppers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const a = await getAnalytics();
      setAnalytics(a);
      const top = await getToppers(10);
      setToppers(top || []);
    })();
  }, []);

  const subjectData = analytics?.subjectAverages
    ? Object.entries(analytics.subjectAverages).map(([k, v]) => ({ subject: k, avg: Number((v as number).toFixed(2)) }))
    : [];

  const semesterData = analytics?.semesterAverages
    ? Object.entries(analytics.semesterAverages).map(([k, v]) => ({ semester: k, avg: Number((v as number).toFixed(2)) }))
    : [];

  const pieData = analytics
    ? [
        { name: "Pass", value: Number((analytics.passRate || 0).toFixed(2)) },
        { name: "Fail", value: Number((100 - (analytics.passRate || 0)).toFixed(2)) },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <header className="sticky top-0 z-20 border-b border-white/20 glass backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}> <ArrowLeft className="h-4 w-4" /> Back</Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">📊 Analytics</h1>
            <p className="text-xs text-muted-foreground">Subject averages, pass rate and topper ranking</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 animate-slideUp grid gap-6">
        <section className="card-enhanced p-6">
          <h2 className="font-bold mb-4">Subject-wise Averages</h2>
          {subjectData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={subjectData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card-enhanced p-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-3">Semester Performance</h3>
            {semesterData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No semester data available.</p>
            ) : (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={semesterData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semester" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold mb-3">Pass Rate</h3>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available.</p>
            ) : (
              <div style={{ width: "100%", height: 220 }} className="flex items-center justify-center">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        <section className="card-enhanced p-6">
          <h3 className="font-bold mb-3">Topper List</h3>
          {toppers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No toppers yet.</p>
          ) : (
            <div className="grid gap-3">
              {toppers.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div>
                    <div className="font-bold">{t.student?.name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground">{t.student?.courseName || ""} • Semester {t.student?.semester || ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg">{Number(t.percentage).toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">Rank #{t.rank}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
