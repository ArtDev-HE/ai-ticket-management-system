export default function ChatInput() {
  return (
    <footer className="bg-green-100 p-4 flex items-center">
      <input
        type="text"
        placeholder="Type your message to the AI assistant..."
        className="flex-1 p-2 rounded border border-gray-300"
      />
      <button className="ml-2 bg-green-500 text-white px-4 py-2 rounded">
        Send
      </button>
    </footer>
  );
}
