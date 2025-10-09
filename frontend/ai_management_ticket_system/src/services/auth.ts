/**
 * Dev-only authentication helper
 * - Provides a simple login() that stores a token in sessionStorage for the browser session.
 * - SessionStorage ensures closing the tab/window clears the session (dev behavior).
 * - This is NOT secure and must be replaced before production (use HttpOnly cookies).
 */

// Backend base url (override with NEXT_PUBLIC_BACKEND_URL)
const BACKEND_BASE = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL : 'http://localhost:3000';

const TOKEN_KEY = 'auth_token';

export const setToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
        if (token) sessionStorage.setItem(TOKEN_KEY, token);
        else sessionStorage.removeItem(TOKEN_KEY);
    }
};

export const getToken = () => (typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null);

export const login = async (username: string, password: string, employeeId?: string) => {
    const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, employeeId })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setToken(data.token);
    return data;
};

export const logout = () => setToken(null);

export const getMe = async () => {
    const token = getToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BACKEND_BASE}/api/auth/me`, { headers });
    if (!res.ok) return null;
    return res.json();
};

export default { setToken, getToken, login, logout, getMe };
