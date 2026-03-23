'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
    onSellClick?: () => void;
}

export default function Navbar({ onSellClick }: NavbarProps) {
    const { logout } = useAuth();

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: 'rgba(245, 243, 239, 0.8)', // Vandy Cream with opacity
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--vandy-sand)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
        }}>
            <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 1 }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center' }}>
                    <Image
                        src="/assets/vu-logo-gold.png"
                        alt="Vanderbilt Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h1 style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '22px',
                        fontWeight: '800',
                        margin: 0,
                        color: 'var(--vandy-black)',
                        letterSpacing: '-0.01em',
                        textTransform: 'uppercase'
                    }}>
                        Reuse <span style={{ color: 'var(--vandy-gold)' }}>Vandy</span>
                    </h1>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--vandy-grey)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Marketplace
                    </span>
                </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                    onClick={onSellClick}
                    style={{
                        backgroundColor: 'var(--vandy-black)',
                        color: 'var(--vandy-gold)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: 'var(--shadow-sm)'
                    }}
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
                    Sell Item
                </button>

                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontWeight: '600',
                        fontSize: '13px',
                        transition: 'all 0.2s'
                    }}
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
                    Logout
                </button>
            </div>
        </nav>
    );
}
