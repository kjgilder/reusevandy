'use client';

import { useState } from 'react';

const categories = ['All', 'Furniture', 'Electronics', 'Textbooks', 'Tickets', 'Clothing', 'Other'];

export default function FilterBar() {
    const [active, setActive] = useState('All');

    return (
        <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '12px 24px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
        }}>
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActive(cat)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: '1px solid #eee',
                        backgroundColor: active === cat ? '#8B7D5B' : '#fff', // Use gold for active
                        color: active === cat ? '#fff' : '#333',
                        fontSize: '13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                    }}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
