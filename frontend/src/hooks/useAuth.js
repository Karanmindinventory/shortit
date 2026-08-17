import { useState, useEffect } from 'react';

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = getCookie('token');
        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
        }
    }, []);

    const login = (newToken) => {
        document.cookie = `token=${newToken}; max-age=604800; path=/; samesite=strict`;
        setToken(newToken);
        setIsAuthenticated(true);
    };

    const logout = () => {
        document.cookie = `token=; max-age=0; path=/;`;
        setToken(null);
        setIsAuthenticated(false);
    };

    return { isAuthenticated, token, login, logout };
}
