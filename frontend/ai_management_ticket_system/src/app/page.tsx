"use client";

import HeaderBar from "@/components/HeaderBar";
import InteractionLog from "@/components/InteractionLog";
import EmployeeInfoPanel from "@/components/EmployeeInfoPanel";
import ChatInput from "@/components/ChatInput";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <HeaderBar />

      <main className="flex flex-1 overflow-hidden">
        <InteractionLog />
        <EmployeeInfoPanel />
      </main>

      <ChatInput />
    </div>
  );
}
