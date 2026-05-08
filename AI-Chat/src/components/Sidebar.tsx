"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pin, PinOff, MessageSquare, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/ChatContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSettings: () => void;
  currentPath?: string;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Sidebar({ isOpen, onToggle, onNewChat, onSettings }: SidebarProps) {
  const router = useRouter();
  const { sessions, sessionId, loadSession, newChat } = useChat();
  const [isHovered, setIsHovered] = useState(false);

  const expanded = isOpen || isHovered;

  const handleNewChat = () => {
    newChat();
    router.push("/");
  };

  const handleSessionClick = (id: string) => {
    if (id === sessionId) return;
    loadSession(id);
    router.push(`/chat?session=${id}`);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onToggle} />
      )}

      {/* Invisible hover zone — wider than the collapsed strip for easy triggering */}
      {!expanded && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          className="fixed top-0 left-0 h-full z-40 hidden md:block"
          style={{ width: 72 }}
        />
      )}

      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => e.stopPropagation()}
        initial={false}
        animate={{ width: expanded ? 260 : (typeof window !== "undefined" && window.innerWidth >= 768 ? 52 : 0) }}
        transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
        className="fixed top-0 left-0 h-full z-50 flex flex-col bg-white border-r border-neutral-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 h-14 border-b border-neutral-100 flex-shrink-0">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500 flex-shrink-0"
            title={isOpen ? "Unpin sidebar" : "Pin sidebar"}
          >
            {isOpen ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="flex items-center gap-2.5"
              >
                <span className="text-[14px] font-medium tracking-tight text-neutral-800">
                  Chat<span className="text-[#E07B39]">bot</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-8" />
        </div>

        {/* New chat */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className={`
              flex items-center gap-2.5 rounded-lg transition-all duration-200
              hover:bg-neutral-100 active:scale-[0.98]
              ${expanded ? "w-full px-3 py-2" : "w-7 h-7 justify-center mx-auto"}
            `}
          >
            <Plus className="w-4 h-4 text-neutral-600 flex-shrink-0" strokeWidth={1.5} />
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="text-[13px] font-medium text-neutral-700 whitespace-nowrap"
                >
                  New chat
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Session list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex-1 overflow-y-auto px-2 py-1"
            >
              <div className="px-2 py-2">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Recent</p>
            <div className="space-y-0.5">
              {sessions.length === 0 && (
                <p className="text-[12px] text-neutral-400 px-2.5 py-2">No chats yet</p>
              )}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSessionClick(s.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors group ${
                    s.id === sessionId ? "bg-neutral-100" : "hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        s.id === sessionId ? "text-[#E07B39]" : "text-neutral-400"
                      }`}
                      strokeWidth={1.5}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] truncate ${
                        s.id === sessionId ? "text-neutral-900 font-medium" : "text-neutral-600 group-hover:text-neutral-900"
                      }`}>
                        {s.title}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{timeAgo(s.updated_at)}</p>
                    </div>
                  </div>
                </button>
                ))}
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="px-3 py-3 border-t border-neutral-100 flex-shrink-0"
            >
              <button
                onClick={onSettings}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                <span className="text-[12px] font-medium">Settings</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
