"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TextTypeProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  cursorBlinkDuration?: number;
}

export default function TextType({
  texts,
  typingSpeed = 75,
  deletingSpeed = 40,
  pauseDuration = 2000,
  showCursor = true,
  cursorCharacter = "_",
  cursorBlinkDuration = 0.5,
}: TextTypeProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [isCursorVisible, setIsCursorVisible] = useState(true);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentFullText = texts[textIndex % texts.length];

  // Cursor blink
  useEffect(() => {
    if (!showCursor) return;
    const blink = setInterval(() => {
      setIsCursorVisible((v) => !v);
    }, cursorBlinkDuration * 1000);
    return () => clearInterval(blink);
  }, [showCursor, cursorBlinkDuration]);

  const tick = useCallback(() => {
    if (!isDeleting) {
      if (displayedText.length < currentFullText.length) {
        setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
      } else {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseDuration);
        return;
      }
    } else {
      if (displayedText.length > 0) {
        setDisplayedText(displayedText.slice(0, -1));
      } else {
        setIsDeleting(false);
        setTextIndex((prev) => prev + 1);
      }
    }
  }, [displayedText, isDeleting, currentFullText, pauseDuration]);

  useEffect(() => {
    const delay = isDeleting ? deletingSpeed : typingSpeed;
    timeoutRef.current = setTimeout(tick, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, isDeleting, typingSpeed, deletingSpeed]);

  return (
    <span className="inline">
      {displayedText}
      {showCursor && (
        <span
          className="text-[#E07B39] font-light transition-opacity"
          style={{ opacity: isCursorVisible ? 1 : 0 }}
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  );
}
