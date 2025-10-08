"use client";

import { useEffect, useRef } from "react";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  pending?: boolean;
}

export default function ChatHistory({
  messages = [],
  onClear,
  onExport,
}: {
  messages?: ChatMessage[];
  onClear?: () => void;
  onExport?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      // small timeout to ensure new content rendered
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }, [messages]);

  return (
    <div className="w-full bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header stays fixed */}
      <div className="p-4 flex items-center justify-between border-b bg-gray-50 flex-none">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <div className="flex gap-2">
          {onExport && (
            <button onClick={onExport} className="text-sm px-2 py-1 bg-white border rounded">Export MD</button>
          )}
          {onClear && (
            <button onClick={onClear} className="text-sm px-2 py-1 bg-red-50 border border-red-200 text-red-600 rounded">Clear</button>
          )}
        </div>
      </div>

      {/* Scrollable messages area */}
      <div ref={containerRef} className="p-4 overflow-auto flex-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No messages yet
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((msg, idx) => (
              <li
                key={idx}
                className={`p-2 rounded-lg ${msg.sender === "user"
                  ? "bg-blue-100 text-blue-900 self-end"
                  : "bg-green-100 text-green-900 self-start"
                  } ${msg.pending ? 'italic opacity-80 animate-pulse' : ''}`}
              >
                <strong>{msg.sender === "user" ? "You:" : "AI:"}</strong>{" "}
                {msg.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
