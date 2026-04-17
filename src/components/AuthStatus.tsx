import React from "react";
import { Button } from "@/components/ui/button";
import { getAuthUser, logout } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

export default function AuthStatus() {
  const navigate = useNavigate();
  const user = getAuthUser();

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {user ? (
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium mr-2">Hi, {user.name}</div>
          <Button size="sm" variant="ghost" onClick={handleLogout}>Logout</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate('/login')}>Login</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/register')}>Register</Button>
        </div>
      )}
    </div>
  );
}
