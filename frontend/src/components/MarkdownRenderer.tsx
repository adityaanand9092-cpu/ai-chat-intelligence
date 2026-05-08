"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

const MarkdownRenderer = memo(
  ({ content, role }: { content: string; role: string }) => {
    const components = useMemo(
      () => ({
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !String(children).includes("\n");
          return isInline ? (
            <code
              className={`font-mono px-1.5 py-0.5 rounded text-[11px] border border-zinc-200/50 ${role === "user" ? "bg-white/50 text-zinc-900" : "bg-[#F3F2EE] text-[#111111]"}`}
              {...props}
            >
              {children}
            </code>
          ) : (
            <div className="border border-[#EBEAE5] rounded-xl my-5 bg-white overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#FAFAF9] border-b border-[#EBEAE5]">
                <span className="text-[10px] font-mono text-zinc-500 font-semibold uppercase tracking-wider">
                  {match?.[1] || "code"}
                </span>
              </div>
              <pre className="p-4 overflow-x-auto text-[12px] font-mono leading-relaxed text-[#111111] bg-white">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            </div>
          );
        },
        p: ({ children }: any) => (
          <p className="mb-4 last:mb-0 leading-[1.65] text-[#111111]">{children}</p>
        ),
        strong: ({ children }: any) => (
          <strong className="font-semibold text-[#111111]">{children}</strong>
        ),
        ul: ({ children }: any) => (
          <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[#111111] marker:text-zinc-400">
            {children}
          </ul>
        ),
        ol: ({ children }: any) => (
          <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-[#111111] marker:text-zinc-400">
            {children}
          </ol>
        ),
        li: ({ children }: any) => <li className="pl-1 leading-[1.65]">{children}</li>,
        h1: ({ children }: any) => (
          <h1 className="text-xl font-bold mt-6 mb-3 text-[#111111] tracking-tight">
            {children}
          </h1>
        ),
        h2: ({ children }: any) => (
          <h2 className="text-lg font-bold mt-5 mb-2 text-[#111111] tracking-tight">{children}</h2>
        ),
        h3: ({ children }: any) => (
          <h3 className="text-base font-semibold mt-4 mb-2 text-[#111111] tracking-tight">{children}</h3>
        ),
      }),
      [role],
    );

    return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
  },
  (prev, next) => prev.content === next.content,
);
MarkdownRenderer.displayName = "MarkdownRenderer";

export default MarkdownRenderer;
