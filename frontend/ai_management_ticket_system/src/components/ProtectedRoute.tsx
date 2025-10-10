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
        let mounted = true;
        const publicPaths = ['/login', '/health'];

        const check = async () => {
            // immediate read
            let token = auth.getToken();
            if (!token && pathname && publicPaths.includes(pathname)) {
                if (mounted) setChecking(false);
                return;
            }

            // retry a couple times with short backoff to avoid false redirects during refresh/hot-reload
            const delays = [100, 300];
            for (const d of delays) {
                if (token) break;
                await new Promise(r => setTimeout(r, d));
                token = auth.getToken();
            }

            if (!token) {
                try { auth.logout(); } catch { /* ignore */ }
                const returnTo = typeof window !== 'undefined' ? window.location.pathname : '/';
                if (mounted) router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
                return;
            }

            if (mounted) setChecking(false);
        };

        check();
        return () => { mounted = false; };
    }, [router, pathname]);

    if (checking) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    return <>{children}</>;
}
