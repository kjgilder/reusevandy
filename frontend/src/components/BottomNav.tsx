'use client';

import Link from 'next/link';
import { Home, MessageSquare, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    const getLinkStyle = (path: string) => {
        const isActive = pathname === path;
        return {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
            color: isActive ? 'var(--vandy-gold)' : 'var(--vandy-grey)',
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
                <MessageSquare size={24} />
                <span style={getTextStyle('/messages')}>Messages</span>
            </Link>
            <Link href="/my-listings" style={getLinkStyle('/my-listings')}>
                <User size={24} />
                <span style={getTextStyle('/my-listings')}>My Listings</span>
            </Link>
        </nav>
    );
}
