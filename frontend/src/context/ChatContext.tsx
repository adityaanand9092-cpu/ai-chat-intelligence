"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { getStoredKey } from "@/components/SettingsModal";

export interface Insight {
  intent: string;
  sentiment: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  insight?: Insight;
  isStreaming?: boolean;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string | null;
  sessions: Session[];
  sendMessage: (text: string, sid?: string) => Promise<void>;
  createSession: () => Promise<string>;
  loadSession: (id: string) => Promise<void>;
  newChat: () => void;
  refreshSessions: () => Promise<void>;
}

const ChatContext = createContext<ChatState | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const refreshSessions = useCallback(async () => {
    try {
      const data = await api("/sessions");
      setSessions(data);
    } catch {
      // Offline — ignore
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const createSession = useCallback(async (): Promise<string> => {
    const session = await api("/sessions", { method: "POST" });
    setSessionId(session.id);
    setMessages([]);
    await refreshSessions();
    return session.id;
  }, [refreshSessions]);

  const loadSession = useCallback(async (id: string) => {
    const msgs = await api(`/sessions/${id}/messages`);
    setSessionId(id);
    setMessages(
      msgs.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        insight: m.intent ? { intent: m.intent, sentiment: m.sentiment || "neutral" } : undefined,
      }))
    );
  }, []);

  const sendMessage = useCallback(async (text: string, sid?: string) => {
    const activeSessionId = sid || sessionId;
    if (!activeSessionId) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const aiId = crypto.randomUUID();
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", isStreaming: true };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: activeSessionId, history, api_key: getStoredKey() }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";
      let lastFlush = Date.now();
      const FLUSH_INTERVAL = 30; // batch updates every 30ms (~33fps, smooth but efficient)

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              fullText += data.token;
              const now = Date.now();
              if (now - lastFlush >= FLUSH_INTERVAL) {
                lastFlush = now;
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiId ? { ...m, content: fullText } : m))
                );
              }
            }
            if (data.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? { ...m, content: fullText, isStreaming: false, insight: { intent: data.intent, sentiment: data.sentiment } }
                    : m
                )
              );
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, content: "Sorry, I couldn't reach the server. Make sure the backend is running at http://localhost:8765.", isStreaming: false, insight: { intent: "unknown", sentiment: "neutral" } }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      await refreshSessions();
    }
  }, [sessionId, messages, refreshSessions]);

  const newChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        sessionId,
        sessions,
        sendMessage,
        createSession,
        loadSession,
        newChat,
        refreshSessions,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
