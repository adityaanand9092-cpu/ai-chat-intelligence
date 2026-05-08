"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

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
      <div
        className={`relative flex flex-col rounded-2xl border bg-white/60 backdrop-blur-sm transition-all duration-300 ${
          isFocused
            ? "border-[#E07B39]/30 bg-white shadow-[0_2px_24px_rgba(0,0,0,0.04)]"
            : "border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        }`}
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
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] resize-none px-4 pt-4 pb-14 font-normal leading-[1.6] text-[#111111] placeholder:text-neutral-400 cursor-text"
          style={{ minHeight: "56px" }}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <motion.button
            onClick={handleSubmit}
            disabled={!hasText || disabled}
            whileTap={hasText ? { scale: 0.9 } : undefined}
            className={`flex items-center justify-center w-[36px] h-[36px] rounded-xl transition-all duration-200 cursor-pointer ${
              hasText
                ? "bg-[#E07B39] text-white hover:bg-[#C96A2E] shadow-sm"
                : "bg-neutral-100 text-neutral-400"
            }`}
          >
            <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
