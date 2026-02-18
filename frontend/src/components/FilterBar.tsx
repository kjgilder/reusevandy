'use client';

const categories = ['All', 'Furniture', 'Electronics', 'Books', 'Tickets', 'Clothing', 'Other'];

interface FilterBarProps {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

export default function FilterBar({ selectedCategory, onSelectCategory }: FilterBarProps) {
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
                    onClick={() => onSelectCategory(cat)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: selectedCategory === cat ? '1px solid var(--vandy-gold)' : '1px solid var(--vandy-sand)',
                        backgroundColor: selectedCategory === cat ? 'var(--vandy-gold)' : '#fff',
                        color: selectedCategory === cat ? 'var(--vandy-black)' : 'var(--vandy-black)',
                        fontWeight: selectedCategory === cat ? '600' : '400',
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
