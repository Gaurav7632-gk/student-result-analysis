import { ResultData } from "@/types/result";

const STORAGE_KEY = "uniresult_history";

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
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
