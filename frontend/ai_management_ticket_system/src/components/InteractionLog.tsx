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

export default function InteractionLog({ aiOutput, messages }: { aiOutput: string | AiResponse | null; messages: ChatMessage[] }) {
  return (
    <section className="flex-1 flex border-r border-gray-200 bg-white">
      {/* 🔹 Right Half - Chat History */}
      <div className="w-1/2 min-w-[50%] overflow-y-auto p-4 border-r border-gray-200">
        <ChatHistory messages={messages} />
      </div>

      {/* 🔹 Left Half - AI Output Panel */}
      <div className="w-1/2 min-w-[50%] border-r border-gray-200 overflow-y-auto p-4">
        <AiOutputPanel output={aiOutput} />
      </div>
    </section>
  );
}
