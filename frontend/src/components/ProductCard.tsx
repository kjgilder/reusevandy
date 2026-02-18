import { BASE_URL } from '../utils/api';

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

export default function ProductCard({ title, price, description, seller, timeAgo, image, category }: ProductProps) {
    const imageUrl = image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : null;

    return (
        <div style={{
            border: '1px solid #eee',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{
                height: '200px',
                backgroundColor: '#f5f5f5',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                        No Image
                    </div>
                )}

                <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#333',
                    zIndex: 1
                }}>{category}</span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px 0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h3>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#8B7D5B' }}>${price}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.4', height: '36px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#999' }}>
                    <span>{seller}</span>
                    <span>{timeAgo}</span>
                </div>
            </div>
        </div>
    );
}
