'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

interface NavbarProps {
    onSellClick?: () => void;
}

export default function Navbar({ onSellClick }: NavbarProps) {
    const { logout } = useAuth();

    return (
        <nav className={styles.nav}>
            <Link href="/home" className={styles.logoArea}>
                <div className={styles.logoContainer}>
                    <Image
                        src="/assets/vu-logo-gold.png"
                        alt="Vanderbilt Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>
                <div className={styles.logoText}>
                    <h1>
                        Reuse <span style={{ color: 'var(--vandy-gold)' }}>Vandy</span>
                    </h1>
                    <span>Marketplace</span>
                </div>
            </Link>

            <div className={styles.actions}>
                <button
                    onClick={onSellClick}
                    className={styles.sellButton}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                >
                    <Plus size={18} />
                    <span>Sell Item</span>
                </button>

                <button
                    onClick={logout}
                    className={styles.logoutButton}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = '#fca5a5';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
}
