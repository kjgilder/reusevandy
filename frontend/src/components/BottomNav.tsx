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
            <Link href="/home" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#8B7D5B' }}>
                <Home size={24} />
                <span style={{ fontSize: '10px' }}>Browse</span>
            </Link>
            <Link href="/messages" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#666' }}>
                <MessageSquare size={24} />
                <span style={{ fontSize: '10px' }}>Messages</span>
            </Link>
            <Link href="/profile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#666' }}>
                <User size={24} />
                <span style={{ fontSize: '10px' }}>My Listings</span>
            </Link>
        </nav>
    );
}
