// In production (Vercel), NEXT_PUBLIC_API_URL is not set, so we use relative "/api"
// In local dev, set NEXT_PUBLIC_API_URL=http://localhost:8765 in frontend/.env.local
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("API Error Response:", errText);
    throw new Error(`${res.status}: ${res.statusText} - ${errText}`);
  }
  return JSON.parse(await res.text());
}
