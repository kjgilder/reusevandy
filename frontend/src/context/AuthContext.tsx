'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../utils/api';

interface User {
    email: string;
    full_name?: string;
    id: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await apiRequest('/auth/me');
                    setUser(userData);
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        // API expects form-urlencoded for OAuth2 password flow
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const data = await apiRequest('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });

        localStorage.setItem('token', data.access_token);
        const userData = await apiRequest('/auth/me');
        setUser(userData);
        router.push('/home');
    };

    const signup = async (email: string, password: string, fullName: string) => {
        if (!email.endsWith('@vanderbilt.edu')) {
            throw new Error('Email must end with @vanderbilt.edu');
        }

        await apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name: fullName }),
        });

        // Auto-login after signup
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
