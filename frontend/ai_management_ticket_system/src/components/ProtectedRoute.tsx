"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import auth from '@/services/auth';

// Simple client-side protection: if no token present, redirect to /login
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = auth.getToken();
        // allow public routes (login, health) to render even without token
        const publicPaths = ['/login', '/health'];
        if (!token && pathname && publicPaths.includes(pathname)) {
            setChecking(false);
            return;
        }
        if (!token) {
            // ensure local session state cleared
            try { auth.logout(); } catch (e) { /* ignore */ }
            const returnTo = typeof window !== 'undefined' ? window.location.pathname : '/';
            router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
            return;
        }
        // small delay to avoid flicker if needed
        setTimeout(() => setChecking(false), 50);
    }, [router]);

    if (checking) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    return <>{children}</>;
}
