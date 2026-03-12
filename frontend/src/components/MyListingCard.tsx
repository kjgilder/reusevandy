import Image from 'next/image';
import { BASE_URL } from '../utils/api';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface MyListingCardProps {
    id: string;
    title: string;
    price: number;
    description: string;
    timeAgo: string;
    image?: string;
    category: string;
    views: number;
    messageCount: number;
    status: 'available' | 'sold' | 'hidden';
    onToggleVisibility: (id: string, currentStatus: string) => void;
    onMarkSold: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function MyListingCard({
    id,
    title,
    price,
    description,
    timeAgo,
    image,
    category,
    views = 0,
    messageCount = 0,
    status,
    onToggleVisibility,
    onMarkSold,
    onDelete
}: MyListingCardProps) {
    const imageUrl = image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : null;
    const isHidden = status === 'hidden';
    const isSold = status === 'sold';

    return (
        <div style={{
            border: '1px solid var(--vandy-light-grey)',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'var(--vandy-white)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative'
        }}>
            <div style={{
                height: '210px',
                backgroundColor: 'var(--vandy-cream)',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--vandy-grey)', fontWeight: '500' }}>
                        No Image
                    </div>
                )}

                {/* Overlays for Sold/Hidden */}
                {(isSold || isHidden) && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2
                    }}>
                        <div style={{
                            backgroundColor: isSold ? 'rgba(212, 175, 55, 0.8)' : 'rgba(128, 128, 128, 0.8)', // Gold for sold, Grey for hidden
                            padding: '8px 24px',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: '700',
                            letterSpacing: '0.05em',
                            fontSize: '18px',
                            backdropFilter: 'blur(4px)'
                        }}>
                            {isSold ? 'SOLD' : 'HIDDEN'}
                        </div>
                    </div>
                )}

                <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(28, 28, 28, 0.8)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'var(--vandy-gold)',
                    zIndex: 3,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>{category}</span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h3 style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '18px',
                        fontWeight: '700',
                        margin: 0,
                        color: 'var(--vandy-black)'
                    }}>{title}</h3>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--vandy-black)' }}>${price}</span>
                </div>

                <p style={{
                    fontSize: '13px',
                    color: 'var(--vandy-grey)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>{description}</p>

                {/* Metrics Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--vandy-grey)' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <span>Views: <strong>{views}</strong></span>
                        <span>Messages: <strong>{messageCount}</strong></span>
                    </div>
                    <span>{timeAgo}</span>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '16px',
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '16px',
                }}>
                    <button
                        onClick={() => onToggleVisibility(id, status)}
                        disabled={isSold}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            color: 'var(--vandy-black)',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: isSold ? 'not-allowed' : 'pointer',
                            opacity: isSold ? 0.3 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                        {isHidden ? 'Show' : 'Hide'}
                    </button>

                    <button
                        onClick={() => isSold ? onToggleVisibility(id, 'hidden') /* hack to reset, see page.tsx */ : onMarkSold(id)}
                        style={{
                            flex: 1,
                            padding: '8px 16px',
                            backgroundColor: isSold ? '#d4af37' : 'transparent',
                            border: '1px solid #d4af37', // Gold border
                            borderRadius: '8px',
                            color: isSold ? 'white' : '#d4af37',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isSold ? 'Re-List' : 'Mark as Sold'}
                    </button>

                    <button
                        onClick={() => onDelete(id)}
                        disabled={isSold}
                        style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: '1px solid #fee2e2',
                            borderRadius: '8px',
                            color: '#ef4444', // Red for delete
                            cursor: isSold ? 'not-allowed' : 'pointer',
                            opacity: isSold ? 0.3 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
