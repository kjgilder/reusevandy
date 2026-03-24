import React, { useState } from 'react';
import Image from 'next/image';
import { BASE_URL } from '../utils/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCardProps {
    id: string;
    title: string;
    description: string;
    price: number;
    images?: string[];
    image?: string;
    seller: string;
    sellerId?: string;
    sellerEmail?: string;
    timeAgo: string;
    category: string;
    onClick?: () => void;
}

export default function ProductCard({ title, description, price, images, image, seller, timeAgo, category, onClick }: ProductCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const displayImages = (images && images.length > 0) ? images : (image ? [image] : []);
    const hasMultipleImages = displayImages.length > 1;
    
    const displayImage = displayImages.length > 0 ? displayImages[currentImageIndex] : null;
    const imageUrl = displayImage ? (displayImage.startsWith('http') ? displayImage : `${BASE_URL}${displayImage}`) : null;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    };

    return (
        <div
            onClick={onClick}
            style={{
                border: '1px solid var(--vandy-light-grey)',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: 'var(--vandy-white)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: onClick ? 'pointer' : 'default',
                boxShadow: 'var(--shadow-sm)'
            }}
            className="product-card"
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.borderColor = 'var(--vandy-gold)';
                }
            }}
            onMouseLeave={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--vandy-light-grey)';
                }
            }}
        >
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
                        style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--vandy-grey)', fontWeight: '500' }}>
                        No Image Available
                    </div>
                )}

                {hasMultipleImages && (
                    <>
                        <button 
                            onClick={prevImage}
                            style={{
                                position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                                backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
                                padding: '4px', cursor: 'pointer', zIndex: 10, display: 'flex'
                            }}
                        >
                            <ChevronLeft size={16} color="var(--vandy-black)" />
                        </button>
                        <button 
                            onClick={nextImage}
                            style={{
                                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
                                padding: '4px', cursor: 'pointer', zIndex: 10, display: 'flex'
                            }}
                        >
                            <ChevronRight size={16} color="var(--vandy-black)" />
                        </button>
                        <div style={{
                            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
                            display: 'flex', gap: '4px', zIndex: 10
                        }}>
                            {displayImages.map((_, i) => (
                                <div 
                                    key={i} 
                                    style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        backgroundColor: i === currentImageIndex ? 'var(--vandy-gold)' : 'rgba(255,255,255,0.5)',
                                        transition: 'all 0.3s'
                                    }}
                                />
                            ))}
                        </div>
                    </>
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
                    zIndex: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>{category}</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h3 style={{ 
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '16px', 
                        fontWeight: '700', 
                        margin: 0, 
                        flex: 1, 
                        color: 'var(--vandy-black)',
                        lineHeight: '1.4'
                    }}>{title}</h3>
                </div>
                <p style={{ 
                    fontSize: '13px', 
                    color: 'var(--vandy-grey)', 
                    margin: 0, 
                    lineHeight: '1.5', 
                    height: '40px', 
                    overflow: 'hidden', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical' 
                }}>{description}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--vandy-grey)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seller</span>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--vandy-black)' }}>{seller}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--vandy-black)' }}>${price}</span>
                        <span style={{ fontSize: '10px', color: 'var(--vandy-grey)' }}>{timeAgo}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
