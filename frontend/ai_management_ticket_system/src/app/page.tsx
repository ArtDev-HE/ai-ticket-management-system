"use client";

import HeaderBar from "@/components/HeaderBar";
import InteractionLog from "@/components/InteractionLog";
import EmployeeInfoPanel from "@/components/EmployeeInfoPanel";
import ChatInput from "@/components/ChatInput";
import { useState, useEffect } from 'react';
import type { AiResponse } from '@/services/ai';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  pending?: boolean;
  createdAt?: string;
}

export default function Home() {
  const [aiOutput, setAiOutput] = useState<AiResponse | string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // localStorage key and limits
  const STORAGE_KEY = 'ai_chat_messages';
  const MAX_MESSAGES = 500; // cap to avoid unbounded growth

  // Load persisted messages on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed.slice(-MAX_MESSAGES));
      }
    } catch (err) {
      console.warn('Failed to load messages from localStorage', err);
    }
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    try {
      const trimmed = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('Failed to save messages to localStorage', err);
    }
  }, [messages]);

  const pushUserMessage = (text: string) => {
    setMessages((m) => [...m, { sender: 'user', text, createdAt: new Date().toISOString() }]);
  };

  const pushAiMessage = (text: string) => {
    setMessages((m) => [...m, { sender: 'ai', text, createdAt: new Date().toISOString() }]);
  };

  const pushPendingAi = () => {
    // add a pending AI placeholder so UI shows "AI is thinking..."
    setMessages((m) => [...m, { sender: 'ai', text: 'AI is thinking...', pending: true, createdAt: new Date().toISOString() }]);
  };

  const replacePendingAi = (text: string) => {
    setMessages((m) => {
      const copy = [...m];
      const idx = copy.findIndex((c) => c.sender === 'ai' && c.pending);
      if (idx !== -1) {
        copy[idx] = { sender: 'ai', text, createdAt: new Date().toISOString() };
      } else {
        copy.push({ sender: 'ai', text, createdAt: new Date().toISOString() });
      }
      return copy;
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const exportMessagesAsMd = () => {
    const lines: string[] = [];
    lines.push(`# Chat export (${new Date().toISOString()})`);
    lines.push('');
    for (const m of messages) {
      const time = m.createdAt ?? '';
      const who = m.sender === 'user' ? 'You' : 'AI';
      lines.push(`- ${time} — **${who}:** ${m.text}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <HeaderBar />

      <main className="flex flex-1 overflow-hidden">
        <InteractionLog aiOutput={aiOutput} messages={messages} onClear={clearMessages} onExport={exportMessagesAsMd} />
        <EmployeeInfoPanel />
      </main>

      <ChatInput
        onSend={(resp) => {
          console.log('[Page] received ai response', resp);
          setAiOutput(resp);
          // replace pending AI with real response text
          if (resp && typeof resp === 'object') {
            replacePendingAi(resp.text ?? 'AI responded');
          }
        }}
        onUserSend={(text) => {
          pushUserMessage(text);
          pushPendingAi();
        }}
      />
    </div>
  );
}
