"use client";

import HeaderBar from "@/components/HeaderBar";
import InteractionLog from "@/components/InteractionLog";
import EmployeeInfoPanel from "@/components/EmployeeInfoPanel";
import ChatInput from "@/components/ChatInput";
import { useState } from 'react';
import type { AiResponse } from '@/services/ai';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export default function Home() {
  const [aiOutput, setAiOutput] = useState<AiResponse | string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const pushUserMessage = (text: string) => {
    setMessages((m) => [...m, { sender: 'user', text }]);
  };

  const pushAiMessage = (text: string) => {
    setMessages((m) => [...m, { sender: 'ai', text }]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <HeaderBar />

      <main className="flex flex-1 overflow-hidden">
        <InteractionLog aiOutput={aiOutput} messages={messages} />
        <EmployeeInfoPanel />
      </main>

      <ChatInput
        onSend={(resp) => {
          console.log('[Page] received ai response', resp);
          setAiOutput(resp);
          // append AI response summary to chat history
          if (resp && typeof resp === 'object') {
            pushAiMessage(resp.text ?? 'AI responded');
          }
        }}
        onUserSend={(text) => pushUserMessage(text)}
      />
    </div>
  );
}
