import Image from 'next/image';

interface ProductProps {
    title: string;
    price: number;
    description: string;
    seller: string;
    timeAgo: string;
    image?: string; // Optional image URL
    category: string;
}

export default function ProductCard({ title, price, description, seller, timeAgo, category }: ProductProps) {
    return (
        <div style={{
            border: '1px solid #eee',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                height: '200px',
                backgroundColor: '#f5f5f5',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa'
            }}>
                {/* Placeholder for image */}
                <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#333'
                }}>{category}</span>
                Image Placeholder
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, flex: 1 }}>{title}</h3>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#8B7D5B' }}>${price}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.4' }}>{description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#999' }}>
                    <span>{seller}</span>
                    <span>{timeAgo}</span>
                </div>
            </div>
        </div>
    );
}
