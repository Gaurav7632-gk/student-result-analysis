import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";
import AuthCard from "@/components/AuthCard";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome back" description="Sign in to access results, analytics, and student history." variant="split">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
          <Input placeholder="name@college.edu" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
          <Input placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>

        {/* Social buttons and extra sentence removed per request */}
      </form>
    </AuthCard>
  );
}
