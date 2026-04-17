import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ShieldCheck, Layout } from "lucide-react";

type AuthCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "split" | "center";
};

export default function AuthCard({ title = "Welcome", description, children, footer, variant = "split" }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {variant === "split" && (
          <div className="hidden md:flex rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-white/10 rounded-full p-3">
                    <Layout size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">UniResult Portal</h3>
                    <p className="text-sm text-white/90">Results & analytics</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold leading-tight">Fast, secure result delivery</h2>
                <p className="mt-3 text-sm text-white/90">Export PDFs, email students, and monitor performance — all in one place.</p>

                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex gap-3 items-start">
                    <div className="bg-white/10 p-2 rounded-md"><Mail size={16} /></div>
                    <span>Rich HTML + PDF attachments</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="bg-white/10 p-2 rounded-md"><ShieldCheck size={16} /></div>
                    <span>Secure access and audit logs</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="text-xs opacity-90">© {new Date().getFullYear()} UniResult</div>
                <Button variant="ghost" size="sm" className="text-white/90 border-white/10">Learn more</Button>
              </div>

              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 opacity-30 filter blur-xl pointer-events-none" />
            </div>
          </div>
        )}

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
      </div>
    </div>
  );
}
