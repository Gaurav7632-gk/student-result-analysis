import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register as registerUser } from "@/lib/auth";
import AuthCard from "@/components/AuthCard";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerUser(name, email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create an account" description="Sign up to start sending result sheets and tracking analytics." variant="split">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Full name</label>
          <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
          <Input placeholder="name@college.edu" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
          <Input placeholder="Create a secure password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Registering...' : 'Create account'}</Button>

        {/* Social buttons and extra sentence removed per request */}
      </form>
    </AuthCard>
  );
}
