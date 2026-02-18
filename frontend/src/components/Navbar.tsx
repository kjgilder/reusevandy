import Image from 'next/image';
import { Plus } from 'lucide-react';

interface NavbarProps {
    onSellClick?: () => void;
}

export default function Navbar({ onSellClick }: NavbarProps) {
    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            backgroundColor: 'var(--vandy-cream)', // Cream background
            borderBottom: '1px solid var(--vandy-sand)', // Sand border
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                    <Image
                        src="/assets/vu-logo-gold.png"
                        alt="Vanderbilt Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: 'var(--vandy-black)' }}>ReUse Vandy</h1>
                    <p style={{ fontSize: '16px', color: 'var(--vandy-grey)', margin: 0 }}>Vanderbilt Marketplace</p>
                </div>
            </div>
            <button
                onClick={onSellClick}
                style={{
                    backgroundColor: 'var(--vandy-gold)', // Flat Gold
                    color: 'var(--vandy-black)', // Black text on gold
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
                <Plus size={16} />
                Sell Item
            </button>
        </nav>
    );
}
