import Link from 'next/link';
import { Home, MessageSquare, User } from 'lucide-react';

export default function BottomNav() {
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
            <Link href="/home" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--vandy-gold)' }}>
                <Home size={24} />
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Browse</span>
            </Link>
            <Link href="/messages" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--vandy-grey)' }}>
                <MessageSquare size={24} />
                <span style={{ fontSize: '10px' }}>Messages</span>
            </Link>
            <Link href="/my-listings" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--vandy-grey)' }}>
                <User size={24} />
                <span style={{ fontSize: '10px' }}>My Listings</span>
            </Link>
        </nav>
    );
}
