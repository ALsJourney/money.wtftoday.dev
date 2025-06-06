'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8558';

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    setUser(data.user);
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/sign-in/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password,
                    callbackURL: '/' // Better Auth callback URL
                }),
            });

            const data = await response.json();

            if (response.ok && data.user) {
                setUser(data.user);
                return { success: true };
            } else {
                return {
                    success: false,
                    error: data.error?.message || 'Invalid email or password'
                };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: 'Network error. Please try again.'
            };
        }
    };

    const signup = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    callbackURL: '/' // Better Auth callback URL
                }),
            });

            const data = await response.json();

            if (response.ok && data.user) {
                setUser(data.user);
                return { success: true };
            } else {
                return {
                    success: false,
                    error: data.error?.message || 'Failed to create account'
                };
            }
        } catch (error) {
            console.error('Signup failed:', error);
            return {
                success: false,
                error: 'Network error. Please try again.'
            };
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
            setUser(null); // Clear user even if request fails
        }
    };

    const value = {
        user,
        login,
        signup,
        logout,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};