"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

interface Insight {
  intent: string;
  sentiment: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  insight?: Insight;
  isStreaming?: boolean;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 py-3 h-8">
      <motion.div
        className="w-2.5 h-2.5 rounded-full bg-[#E07B39]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="text-[12px] font-medium text-[#E07B39]"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Thinking
      </motion.span>
    </div>
  );
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAutoScrollEnabled = useRef(true);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // Tighter threshold to ensure even small scrolls up are detected
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= 40;
    
    if (isNearBottom) {
      isAutoScrollEnabled.current = true;
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      // Scrolling up
      isAutoScrollEnabled.current = false;
    }
  };

  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0].clientY > touchStartY.current) {
      // Scrolling up (finger moving down)
      isAutoScrollEnabled.current = false;
    }
  };

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto", 
        block: "end" 
      });
    }
  }, []);

  // Handle new messages and streaming updates
  useEffect(() => {
    if (isAutoScrollEnabled.current) {
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  // Handle initial load snapping to bottom if we start with messages
  useEffect(() => {
    if (messages.length > 0 && isAutoScrollEnabled.current) {
      // Need a tiny timeout to ensure DOM is ready
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth"
      >
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 w-full">
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const prev = i > 0 ? messages[i - 1] : null;
            const isNewExchange = prev && prev.role === "assistant" && isUser;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`w-full flex flex-col ${isUser ? "items-end" : "items-start"} ${isNewExchange ? "mt-8" : "mt-3"}`}
              >
                {isUser ? (
                  <div className="inline-block max-w-[85%] text-left">
                    <div className="inline-block px-5 py-3.5 bg-neutral-200/80 text-neutral-900 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed font-normal whitespace-pre-wrap antialiased">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="prose prose-neutral max-w-full w-full text-[14px] leading-relaxed font-normal text-neutral-800">
                      {msg.isStreaming && !msg.content ? (
                        <TypingIndicator />
                      ) : (
                        <MarkdownRenderer content={msg.content} role={msg.role} />
                      )}
                    </div>
                    {msg.insight && !msg.isStreaming && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-3 text-[12px] text-neutral-500"
                      >
                        Intent: <span className="text-[#E07B39] font-semibold">{msg.insight.intent}</span>
                        <span className="mx-2 text-neutral-300">·</span>
                        Sentiment: <span className={`font-semibold ${
                          msg.insight.sentiment === "positive"
                            ? "text-emerald-600"
                            : msg.insight.sentiment === "negative"
                            ? "text-red-500"
                            : "text-neutral-700"
                        }`}>{msg.insight.sentiment}</span>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              isAutoScrollEnabled.current = true;
              scrollToBottom(true);
            }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-neutral-200 shadow-sm text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors z-10"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;
