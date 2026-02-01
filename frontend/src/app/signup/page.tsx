'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import styles from '../page.module.css';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const { signup } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!email.endsWith('@vanderbilt.edu')) {
                setError('Must use a Vanderbilt email address');
                return;
            }
            await signup(email, password, fullName);
        } catch (err: unknown) {
            let message = 'Signup failed';
            if (err instanceof Error) {
                message = err.message;
            }

            if (message.includes('already exists')) {
                setError('Already has an account');
            } else {
                setError(message);
            }
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authHeader}>
                <h1 className={styles.authTitle}>Reuse <span>Vandy</span></h1>
                <p className={styles.authSubtitle}>Create your account</p>
            </div>

            <div className={styles.authCard}>
                <h2 className={styles.authCardTitle}>Sign Up</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <p className={styles.error}>{error}</p>}
                    <div className={styles.inputGroup}>
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="name"
                            required
                        />
                    </div>
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
                        <span style={{ fontSize: '11px', color: '#888' }}>Must end in @vanderbilt.edu</span>
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
                    <button type="submit" className={styles.button}>Sign Up</button>
                </form>

                <div className={styles.authFooter}>
                    Already have an account? <Link href="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}
