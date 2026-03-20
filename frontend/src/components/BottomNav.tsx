'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, MessageSquare, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getUnreadTotal } from '../utils/api';

export default function BottomNav() {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const data = await getUnreadTotal();
                setUnreadCount(data.total);
            } catch (err) {
                console.error('Failed to fetch unread count:', err);
            }
        };

        fetchUnread();
        // Refresh every 30 seconds
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [pathname]); // Refresh when path changes (User might have read messages)

    const getLinkStyle = (path: string) => {
        const isActive = pathname === path;
        return {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
            color: isActive ? 'var(--vandy-gold)' : 'var(--vandy-grey)',
            position: 'relative' as const
        };
    };

    const getTextStyle = (path: string) => {
        return {
            fontSize: '10px',
            fontWeight: pathname === path ? 'bold' : 'normal',
        };
    };

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '12px 0',
            backgroundColor: '#fff',
            borderTop: '1px solid #eee',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100
        }}>
            <Link href="/home" style={getLinkStyle('/home')}>
                <Home size={24} />
                <span style={getTextStyle('/home')}>Browse</span>
            </Link>
            <Link href="/messages" style={getLinkStyle('/messages')}>
                <div style={{ position: 'relative' }}>
                    <MessageSquare size={24} />
                    {unreadCount > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-8px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white'
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                </div>
                <span style={getTextStyle('/messages')}>Messages</span>
            </Link>
            <Link href="/my-listings" style={getLinkStyle('/my-listings')}>
                <User size={24} />
                <span style={getTextStyle('/my-listings')}>My Listings</span>
            </Link>
        </nav>
    );
}
