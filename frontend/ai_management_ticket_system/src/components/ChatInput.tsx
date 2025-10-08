import { useState } from 'react';
import { generateVisualizationDescriptor, AiResponse } from '@/services/ai';

export default function ChatInput({ onSend, onUserSend }: { onSend?: (resp: AiResponse) => void; onUserSend?: (text: string) => void }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    // do nothing when input is empty
    if (!value || value.trim() === '') return;

    // notify parent that user sent a message
    onUserSend?.(value);

    setLoading(true);
    try {
      console.log('[ChatInput] sending prompt:', value);
      const res = await generateVisualizationDescriptor(value);
      console.log('[ChatInput] received AI response:', res);
      onSend?.(res as AiResponse);
    } finally {
      setLoading(false);
    }
    setValue('');
  };

  return (
    <footer className="bg-green-100 p-4 flex items-center relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        type="text"
        placeholder="Type your message to the AI assistant..."
        className="flex-1 p-2 rounded border border-gray-300"
      />
      <button
        disabled={loading}
        onClick={handleSend}
        className="ml-2 bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded"
      >
        {loading ? 'Thinking...' : 'Send'}
      </button>

      {/* no transient message UI anymore */}
    </footer>
  );
}
