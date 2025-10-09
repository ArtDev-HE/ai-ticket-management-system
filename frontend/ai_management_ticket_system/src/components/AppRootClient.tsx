"use client";

import Providers from './Providers';
import ProtectedRoute from './ProtectedRoute';

export default function AppRootClient({ children }: { children: React.ReactNode }) {
    return (
        <Providers>
            <ProtectedRoute>{children}</ProtectedRoute>
        </Providers>
    );
}
