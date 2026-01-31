import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function Navbar() {
    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #eee',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#8B7D5B', // Bronze/Gold color for logo placeholder
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                }}>V</div>
                <div>
                    <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Vandy Marketplace</h1>
                    <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>For Vanderbilt Students</p>
                </div>
            </div>
            <button style={{
                backgroundColor: '#8B7D5B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 500
            }}>
                <Plus size={16} />
                Sell Item
            </button>
        </nav>
    );
}
