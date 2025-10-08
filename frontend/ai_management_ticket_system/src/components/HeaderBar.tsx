import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

export default function HeaderBar() {
  const { currentEmployeeId, setCurrentEmployeeId } = useUser();
  const [emp, setEmp] = useState<string>(currentEmployeeId || '');

  useEffect(() => {
    setEmp(currentEmployeeId || '');
  }, [currentEmployeeId]);

  const save = () => {
    setCurrentEmployeeId(emp || null);
    console.log('[HeaderBar] set current employee to', emp);
  };

  return (
    <header className="bg-orange-500 text-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-white rounded mr-3" />
        <h1 className="text-xl font-bold">AI Ticket System Dashboard</h1>
      </div>

      {/* Dev-only: quick select employee id to drive EmployeeInfoPanel */}
      <div className="flex items-center gap-2">
        <input
          value={emp}
          onChange={(e) => setEmp(e.target.value)}
          placeholder="EMP-001"
          className="px-2 py-1 rounded text-black"
        />
        <button onClick={save} className="bg-white text-orange-500 px-3 py-1 rounded">Set Employee</button>
      </div>
    </header>
  );
}
