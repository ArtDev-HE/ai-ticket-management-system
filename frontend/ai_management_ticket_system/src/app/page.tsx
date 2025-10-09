"use client";

import HeaderBar from "@/components/HeaderBar";
import InteractionLog from "@/components/InteractionLog";
import EmployeeInfoPanel from "@/components/EmployeeInfoPanel";
import ChatInput from "@/components/ChatInput";
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import type { AiResponse } from '@/services/ai';

// Backend base url (override with NEXT_PUBLIC_BACKEND_URL)
const BACKEND_BASE = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL : 'http://localhost:3000';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  pending?: boolean;
  createdAt?: string;
}

export default function Home() {
  const [aiOutput, setAiOutput] = useState<AiResponse | string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // storage key and limits — namespace per authenticated employee so chat follows login
  const { currentEmployeeId } = useUser();
  const STORAGE_KEY_BASE = 'ai_chat_messages';
  const STORAGE_KEY = currentEmployeeId ? `${STORAGE_KEY_BASE}:${currentEmployeeId}` : STORAGE_KEY_BASE;
  const MAX_MESSAGES = 500; // cap to avoid unbounded growth

  // Load persisted messages on mount and when authenticated employee changes
  useEffect(() => {
    try {
      const storage = (typeof window !== 'undefined' && sessionStorage) ? sessionStorage : localStorage;
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed.slice(-MAX_MESSAGES));
      }
    } catch (err) {
      console.warn('Failed to load messages from storage', err);
    }
  }, [STORAGE_KEY]);

  // Persist messages whenever they change
  useEffect(() => {
    try {
      const trimmed = messages.slice(-MAX_MESSAGES);
      const storage = (typeof window !== 'undefined' && sessionStorage) ? sessionStorage : localStorage;
      storage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('Failed to save messages to storage', err);
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
    (async () => {
      const mdLines: string[] = [];
      mdLines.push(`# Chat export (${new Date().toISOString()})`);
      mdLines.push('');
      for (const m of messages) {
        const time = m.createdAt ?? '';
        const who = m.sender === 'user' ? 'You' : 'AI';
        mdLines.push(`- ${time} — **${who}:** ${m.text}`);
      }

      // Try to get a server signature and embed it in the MD as a JSON HTML comment header
      let header = '';
      try {
        const payload = { employeeId: currentEmployeeId, exportedAt: new Date().toISOString(), messages };
        const token = sessionStorage.getItem('auth_token');
        const res = await fetch(`${BACKEND_BASE}/api/chat/export`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const body = await res.json();
          const signed = { ...payload, signature: body.signature };
          header = `<!--CHAT_EXPORT_JSON_START\n${JSON.stringify(signed)}\nCHAT_EXPORT_JSON_END-->\n\n`;
        }
      } catch (e) {
        // ignore signature errors — fallback to plain MD
      }

      const blob = new Blob([header + mdLines.join('\n')], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString()}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })();
  };

  const handleExport = useCallback(async () => {
    // Signed export: ask server to sign the export payload
    try {
      const payload = {
        employeeId: currentEmployeeId,
        exportedAt: new Date().toISOString(),
        messages,
      };
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${BACKEND_BASE}/api/chat/export`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Export failed ${res.status}`);
      const body = await res.json();
      const signed = { ...payload, signature: body.signature, md: messages.map(m => `${m.sender}: ${m.text}`).join('\n') };
      const blob = new Blob([JSON.stringify(signed, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_export_${currentEmployeeId || 'anon'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error', err);
      alert('Export failed: ' + (err as Error).message);
    }
  }, [messages, currentEmployeeId]);

  const handleImportFile = useCallback(async (file: File) => {
    try {
      const raw = await file.text();
      // Detect embedded signed JSON header in MD exports
      const startMarker = '<!--CHAT_EXPORT_JSON_START';
      const endMarker = 'CHAT_EXPORT_JSON_END-->';
      let jsonText: string | null = null;
      const startIdx = raw.indexOf(startMarker);
      if (startIdx !== -1) {
        const afterStart = raw.indexOf('\n', startIdx);
        const endIdx = raw.indexOf(endMarker, afterStart >= 0 ? afterStart : startIdx);
        if (endIdx !== -1) {
          jsonText = raw.substring(afterStart + 1, endIdx).trim();
        }
      }
      const parsed = jsonText ? JSON.parse(jsonText) : JSON.parse(raw);
      // Basic validation
      if (!parsed || !parsed.signature || !parsed.messages) {
        alert('Invalid import file: missing signature or messages');
        return;
      }
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${BACKEND_BASE}/api/chat/import`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Import failed ${res.status}: ${txt}`);
      }
      const body = await res.json();
      // body.messages should be the validated messages
      if (Array.isArray(body.messages)) {
        // merge: append imported messages to existing
        setMessages(prev => {
          const merged = [...prev, ...body.messages];
          const key = `ai_chat_messages:${currentEmployeeId}`;
          try { sessionStorage.setItem(key, JSON.stringify(merged)); } catch (e) { }
          return merged;
        });
      }
      alert('Import successful');
    } catch (err) {
      console.error('Import error', err);
      alert('Import failed: ' + (err as Error).message);
    }
  }, [currentEmployeeId]);
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <HeaderBar />

      <main className="flex flex-1 overflow-hidden">
        <InteractionLog aiOutput={aiOutput} messages={messages} onClear={clearMessages} onExport={exportMessagesAsMd} onImport={handleImportFile} />
        <EmployeeInfoPanel />
      </main>

      <ChatInput
        onSend={(resp, isCommand) => {
          console.log('[Page] received ai response', resp, 'isCommand=', isCommand);
          // Only update the AiOutputPanel when this was a recognized command
          if (isCommand) setAiOutput(resp);
          // Regardless, replace pending AI message in the chat with the textual response
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
