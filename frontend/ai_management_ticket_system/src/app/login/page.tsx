"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import auth from '@/services/auth';
import { useUser } from '@/context/UserContext';

export default function LoginPage() {
    const router = useRouter();
    const { setCurrentEmployeeId } = useUser();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // employeeId is determined by authentication; remove manual input
    const [employeeId] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    const search = useSearchParams();
    const returnTo = search?.get('returnTo') || '/';

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await auth.login(username, password, employeeId || undefined);
            const me = await auth.getMe();
            if (me && me.employeeId) setCurrentEmployeeId(me.employeeId);
            router.replace(returnTo);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Login failed');
        }
    };

    return (
        <div style={{ maxWidth: 420, margin: '4rem auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
            <h2>Dev Login</h2>
            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 8 }}>
                    <label>Username</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
                </div>
                {/* employeeId removed: determined by authentication */}
                {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
}
