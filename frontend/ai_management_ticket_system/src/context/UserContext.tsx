"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'current_employee';

interface UserContextShape {
    currentEmployeeId: string | null;
    setCurrentEmployeeId: (id: string | null) => void;
}

const UserContext = createContext<UserContextShape | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentEmployeeId, setCurrentEmployeeIdState] = useState<string | null>(null);

    useEffect(() => {
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
        if (stored) setCurrentEmployeeIdState(stored);

        // Do not clear sessionStorage on refresh — keep the authenticated session across reloads.
        // Explicit logout should clear sessionStorage via the auth service.
        return;
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (currentEmployeeId) sessionStorage.setItem(STORAGE_KEY, currentEmployeeId);
            else sessionStorage.removeItem(STORAGE_KEY);
        }
    }, [currentEmployeeId]);

    const setCurrentEmployeeId = (id: string | null) => {
        setCurrentEmployeeIdState(id);
    };

    return (
        <UserContext.Provider value={{ currentEmployeeId, setCurrentEmployeeId }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used within UserProvider');
    return ctx;
};

export default UserContext;
