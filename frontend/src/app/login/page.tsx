'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Login failed');
            } else {
                setError('Login failed');
            }
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authHeader}>
                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 32px' }}>
                    <Image
                        src="/assets/vu-logo-gold.png"
                        alt="Vanderbilt Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>
                <h1 className={styles.authTitle}>Reuse <span>Vandy</span></h1>
                <p className={styles.authSubtitle}>The Premier Vanderbilt Marketplace</p>
            </div>

            <div className={styles.authCard}>
                <h2 className={styles.authCardTitle}>Welcome back</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <p className={styles.error}>{error}</p>}
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Vanderbilt Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="username@vanderbilt.edu"
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
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', marginTop: '-8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--vandy-grey)', cursor: 'pointer', fontWeight: '500' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--vandy-gold)' }} /> Remember me
                        </label>
                        <a href="#" style={{ color: 'var(--vandy-gold)', fontWeight: '600', textDecoration: 'none' }}>Forgot password?</a>
                    </div>

                    <button type="submit" className={styles.button}>Login</button>
                </form>

                <div className={styles.authFooter}>
                    New to Reuse Vandy? <Link href="/signup">Create an account</Link>
                </div>
            </div>
        </div>
    );
}
