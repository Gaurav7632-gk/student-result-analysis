import { ResultData } from "@/types/result";

const STORAGE_KEY = "uniresult_history";
const AUTH_TOKEN_KEY = "auth_token";

export function getSavedResults(): ResultData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveResult(result: ResultData): void {
  const results = getSavedResults();
  const existing = results.findIndex((r) => r.id === result.id);
  if (existing >= 0) {
    results[existing] = result;
  } else {
    results.unshift(result);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export async function saveResultRemote(result: ResultData): Promise<{ ok: boolean; id?: string }>
{
  try {
    const headers: Record<string,string> = { "Content-Type": "application/json" };
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify(result),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false };
  }
}

export function deleteResult(id: string): void {
  const results = getSavedResults().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export async function getSubmissions(params?: { q?: string; course?: string; semester?: string; limit?: number; offset?: number; user_only?: boolean; }): Promise<any[]> {
  try {
    const query: Record<string, string> = {};
    if (params) {
      if (params.q) query.q = params.q;
      if (params.course) query.course = params.course;
      if (params.semester) query.semester = String(params.semester);
      if (params.limit) query.limit = String(params.limit);
      if (params.offset) query.offset = String(params.offset);
      if (params.user_only) query.user_only = String(1);
    }
    const qs = Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : "";
    const headers: Record<string,string> = {};
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/submissions${qs}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    // Normalize to ResultData-like shape where possible
    return data.map((row: any) => {
      const payload = row.data || row;
      const id = row.id != null ? String(row.id) : (payload.id ? String(payload.id) : crypto.randomUUID());
      const createdAt = row.created_at || payload.createdAt || new Date().toISOString();
      return { id, student: payload.student || {}, subjects: payload.subjects || [], createdAt };
    });
  } catch (e) {
    return [];
  }
}

export async function getAnalytics(params?: Record<string, string>) {
  try {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const headers: Record<string,string> = {};
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/analytics${qs}`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function getToppers(limit = 10, params?: Record<string, string>) {
  try {
    const q = Object.assign({}, params || {});
    q.limit = String(limit);
    const qs = `?${new URLSearchParams(q).toString()}`;
    const headers: Record<string,string> = {};
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/toppers${qs}`, { headers });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function emailPdf(file: Blob | File, email: string, subject?: string) {
  const fd = new FormData();
  const name = (file instanceof File && file.name) ? file.name : `${(subject || 'result')}.pdf`;
  fd.append('file', file, name);
  fd.append('email', email);
  if (subject) fd.append('subject', subject);
  const headers: Record<string, string> = {};
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/send-email`, {
    method: 'POST',
    headers,
    body: fd,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch (e) {
    try {
      data = { error: await res.text() };
    } catch (_e) {
      data = { error: String(e) };
    }
  }
  return { ok: res.ok, status: res.status, data };
}
