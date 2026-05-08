"use client";

import { useEffect, useState } from "react";

interface Status {
  mode: string;
  model: string;
  db: string;
}

export default function StatusBar() {
  const [status, setStatus] = useState<Status | null>(null);
  const [online, setOnline] = useState(true);
  const [storedKey, setStoredKey] = useState<string | null>(null);

  useEffect(() => {
    setStoredKey(localStorage.getItem("chatbot_gemini_key"));
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
    fetch(`${API_BASE}/config/status`)
      .then(async (r) => {
        if (r.ok) {
          setStatus(await r.json());
          setOnline(true);
        }
      })
      .catch(() => setOnline(false));
  }, []);

  const llmActive = !!storedKey || status?.mode === "gemini";
  const dbActive = status?.db === "supabase";

  if (online) {
    return (
      <div className="flex items-center gap-1.5 select-none text-[10px] text-neutral-500 font-medium px-2 py-1 rounded-md bg-white/60 backdrop-blur-sm border border-neutral-200/40">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${llmActive ? "bg-emerald-500" : "bg-amber-500"}`} />
          {llmActive ? "Gemini" : "Mock"}
        </span>
        <span className="text-neutral-300">·</span>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${dbActive ? "bg-emerald-500" : "bg-neutral-400"}`} />
          {dbActive ? "Supabase" : "Memory"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 select-none text-[10px] text-neutral-500 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Offline
    </div>
  );
}
