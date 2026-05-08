"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InputBoxProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function InputBox({ onSend, disabled }: InputBoxProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const justSentRef = useRef(false);

  useEffect(() => {
    if (!disabled && textareaRef.current && !justSentRef.current) {
      textareaRef.current.focus();
    }
    justSentRef.current = false;
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || disabled) return;
    justSentRef.current = true;
    onSend(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const hasText = inputValue.trim().length > 0;

  return (
    <div className="w-full">
      <motion.div
        animate={{
          borderColor: isFocused ? "rgba(224, 123, 57, 0.3)" : "rgba(229, 229, 229, 1)",
          boxShadow: isFocused 
            ? "0 4px 32px rgba(224, 123, 57, 0.08)" 
            : "0 1px 3px rgba(0, 0, 0, 0.02)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={() => textareaRef.current?.focus()}
        className="relative flex flex-col rounded-2xl border bg-white/60 backdrop-blur-sm custom-cursor-text"
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Ask anything..."
          rows={1}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] resize-none px-4 pt-4 pb-14 font-normal leading-[1.6] text-[#111111] placeholder:text-neutral-400 custom-cursor-text"
          style={{ minHeight: "56px" }}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <AnimatePresence>
            {hasText && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={handleSubmit}
                disabled={disabled}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-[36px] h-[36px] rounded-xl cursor-pointer bg-[#E07B39] text-white shadow-sm"
              >
                <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
