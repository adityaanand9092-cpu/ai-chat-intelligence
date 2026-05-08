"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_KEY = "chatbot_gemini_key";

export function getStoredKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY);
}

export function storeKey(key: string) {
  localStorage.setItem(API_KEY, key);
}

export function clearKey() {
  localStorage.removeItem(API_KEY);
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [llmStatus, setLlmStatus] = useState<{ mode: string; model: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredKey();
      if (stored) setKey(stored);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
      fetch(`${API_BASE}/config/status`)
        .then((r) => r.json())
        .then(setLlmStatus)
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!key.trim()) {
      clearKey();
      setStatus("saved");
      setLlmStatus({ mode: "fallback", model: "gemini-2.5-flash" });
      setTimeout(() => onClose(), 800);
      return;
    }

    setStatus("saving");
    try {
      storeKey(key.trim());
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
      await fetch(`${API_BASE}/config/llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key.trim(), model: "gemini-2.5-flash" }),
      });
      setStatus("saved");
      setLlmStatus({ mode: "gemini", model: "gemini-2.5-flash" });
      setTimeout(() => onClose(), 800);
    } catch {
      setStatus("error");
      setErrorMsg("Couldn't reach the backend. Make sure it's running on :8765");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-[400px] mx-4"
          >
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-neutral-800">LLM Settings</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => {
                      setKey(e.target.value);
                      setStatus("idle");
                    }}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#E07B39]/40 focus:ring-1 focus:ring-[#E07B39]/20 transition-all"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    Get your key at{" "}
                    <a href="https://aistudio.google.com/apikey" target="_blank" className="text-[#E07B39] hover:underline">
                      aistudio.google.com
                    </a>
                  </p>
                </div>

                <div className="flex items-center justify-between text-[12px] text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2">
                  <span>Model</span>
                  <span className="font-medium text-neutral-700">gemini-2.5-flash</span>
                </div>

                {llmStatus && (
                  <div className={`flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg ${
                    llmStatus.mode === "gemini" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${llmStatus.mode === "gemini" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {llmStatus.mode === "gemini" ? "Gemini LLM active" : "Using fallback responses"}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={status === "saving"}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    status === "saved"
                      ? "bg-emerald-500 text-white"
                      : status === "error"
                      ? "bg-red-500 text-white"
                      : "bg-[#E07B39] text-white hover:bg-[#C96A2E]"
                  }`}
                >
                  {status === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === "saved" && <Check className="w-4 h-4" />}
                  {status === "saved" ? "Saved" : status === "error" ? "Retry" : "Save"}
                </button>

                {errorMsg && (
                  <p className="text-[11px] text-red-500 text-center">{errorMsg}</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
