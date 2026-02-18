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
                        border: '1px solid #eee',
                        backgroundColor: selectedCategory === cat ? '#8B7D5B' : '#fff', // Use gold for active
                        color: selectedCategory === cat ? '#fff' : '#333',
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
