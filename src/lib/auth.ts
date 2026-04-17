const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthUser(user: any | null) {
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_USER_KEY);
}

export function getAuthUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'login failed');
  setAuthToken(data.token);
  setAuthUser(data.user || null);
  return data;
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'register failed');
  setAuthToken(data.token);
  setAuthUser(data.user || null);
  return data;
}

export function logout() {
  setAuthToken(null);
  setAuthUser(null);
}
