"use client";

import { useState } from "react";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export default function ChatHistory({
  messages = [],
}: {
  messages?: ChatMessage[];
}) {
  const [localMessages] = useState<ChatMessage[]>(messages);

  return (
    <div className="w-1/2 bg-gray-50 border-r border-gray-200 p-4 overflow-auto">
      <h2 className="text-lg font-semibold mb-3">Chat History</h2>

      {localMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          No messages yet
        </div>
      ) : (
        <ul className="space-y-2">
          {localMessages.map((msg, idx) => (
            <li
              key={idx}
              className={`p-2 rounded-lg ${msg.sender === "user"
                  ? "bg-blue-100 text-blue-900 self-end"
                  : "bg-green-100 text-green-900 self-start"
                }`}
            >
              <strong>{msg.sender === "user" ? "You:" : "AI:"}</strong>{" "}
              {msg.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
