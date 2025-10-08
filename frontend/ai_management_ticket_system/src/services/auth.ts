/**
 * Dev-only authentication helper
 * - Provides a simple login() that stores a fake token in localStorage for development.
 * - This is NOT secure and must be replaced before production.
 */

export const DEV_TOKEN = 'dev-token-x-please-replace';

export const loginDev = async (username: string, password: string) => {
    // In dev, accept any username/password and persist a dev token
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', DEV_TOKEN);
    }
    return { token: DEV_TOKEN };
};

export const logoutDev = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
    }
};

export const getDevToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

export default { loginDev, logoutDev, getDevToken };

// Dev helper: current employee id (used to wire EmployeeInfoPanel to a selected employee)
export const setCurrentEmployeeId = (id: string | null) => {
    if (typeof window !== 'undefined') {
        if (id) localStorage.setItem('current_employee', id);
        else localStorage.removeItem('current_employee');
    }
};

export const getCurrentEmployeeId = () => (typeof window !== 'undefined' ? localStorage.getItem('current_employee') : null);
