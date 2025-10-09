"use client";

import { useState } from "react";
import ChatHistory from "./ChatHistory";
import AiOutputPanel from "./AiOutputPanel";

/**
 * ======================================
 * 💬 InteractionLog
 * ======================================
 * Left side → AI Analysis
 * Right side → Chat History
 */
import type { AiResponse } from '@/services/ai';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export default function InteractionLog({ aiOutput, messages, onClear, onExport, onImport }: { aiOutput: string | AiResponse | null; messages: ChatMessage[]; onClear?: () => void; onExport?: () => void; onImport?: (file: File) => void }) {
  return (
    <section className="flex-1 flex bg-white">
      {/* 🔹 Right Half - Chat History */}
      <div className="w-1/2 min-w-[50%] p-4 border-r border-gray-200 h-full">
        <ChatHistory messages={messages} onClear={onClear} onExport={onExport} onImport={onImport} />
      </div>

      {/* 🔹 Left Half - AI Output Panel */}
      <div className="w-1/2 min-w-[50%] border-r border-gray-200 p-4 h-full overflow-auto">
        <AiOutputPanel output={aiOutput} />
      </div>
    </section>
  );
}
