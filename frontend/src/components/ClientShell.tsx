"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChatProvider } from "@/context/ChatContext";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import StatusBar from "@/components/StatusBar";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <ChatProvider>
      <div className="flex h-screen w-full bg-[#FAFAF9] text-[#111111] font-sans overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={() => router.push("/")}
          onSettings={() => setSettingsOpen(true)}
          currentPath={pathname}
        />
        <div
          className="flex-1 flex flex-col min-h-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative"
          style={{ marginLeft: isDesktop ? (sidebarOpen ? 260 : 52) : 0 }}
        >
          <div className="absolute top-3 right-4 z-20">
            <StatusBar />
          </div>
          {children}
        </div>
      </div>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ChatProvider>
  );
}
