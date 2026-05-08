"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useChat } from "@/context/ChatContext";
import InputBox from "@/components/InputBox";
import TextType from "@/components/TextType";

const TEXT_CYCLE = [
  "Detects intent & sentiment",
  "Streams responses word-by-word",
  "Remembers conversation history",
  "Powered by Gemini 2.5 Flash",
  "Configure your own API key",
  "Works offline with smart fallback",
];

export default function HomePage() {
  const router = useRouter();
  const { createSession, sendMessage, isLoading } = useChat();

  const handleSend = async (text: string) => {
    const sid = await createSession();
    sendMessage(text, sid);
    router.push(`/chat?session=${sid}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
      <div className="flex flex-col items-center gap-6 -mt-12 w-full max-w-3xl">
        <div className="flex flex-col items-center gap-2 text-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[32px] md:text-[40px] tracking-tight leading-tight"
          >
            <span className="text-[#1d1d1f] font-medium">What can I</span>{" "}
            <span className="text-[#E07B39] font-normal">help</span>{" "}
            <span className="text-[#1d1d1f] font-medium">with?</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-[15px] md:text-[16px] text-[#6F6B65] font-normal min-h-[26px]"
          >
            <TextType
              texts={TEXT_CYCLE}
              typingSpeed={60}
              deletingSpeed={30}
              pauseDuration={2200}
              cursorCharacter="|"
            />
          </motion.div>
        </div>

        <InputBox onSend={handleSend} disabled={isLoading} />

        <p className="text-[12px] text-neutral-400 text-center mt-4 select-none">
          Chatbot can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
