"use client";

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import auth from '@/services/auth';
import { useRouter } from 'next/navigation';

export default function HeaderBar() {
  const { currentEmployeeId, setCurrentEmployeeId } = useUser();
  const router = useRouter();

  useEffect(() => {
    // nothing for now
  }, [currentEmployeeId]);

  const onLogout = () => {
    auth.logout();
    setCurrentEmployeeId(null);
    router.replace('/login');
  };

  return (
    <header className="bg-orange-500 text-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-white rounded mr-3" />
        <h1 className="text-xl font-bold">AI Ticket System Dashboard</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-sm mr-3">{currentEmployeeId ? `Employee: ${currentEmployeeId}` : 'Not signed in'}</div>
        <button onClick={onLogout} className="bg-white text-orange-500 px-3 py-1 rounded">Logout</button>
      </div>
    </header>
  );
}
