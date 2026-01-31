'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import styles from '../page.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authHeader}>
                <h1 className={styles.authTitle}>Reuse <span>Vandy</span></h1>
                <p className={styles.authSubtitle}>Welcome back</p>
            </div>

            <div className={styles.authCard}>
                <h2 className={styles.authCardTitle}>Login</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <p className={styles.error}>{error}</p>}
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email"
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            required
                        />
                    </div>
                    {/* Added 'Remember me' placeholder for visual match although logic is not requested */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', cursor: 'pointer' }}>
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="#" style={{ color: '#D4AF37', textDecoration: 'none' }}>Forgot password?</a>
                    </div>

                    <button type="submit" className={styles.button}>Login</button>
                </form>

                <div className={styles.authFooter}>
                    Don't have an account? <Link href="/signup">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
