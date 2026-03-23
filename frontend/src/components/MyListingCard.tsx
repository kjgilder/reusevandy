import Image from 'next/image';
import { BASE_URL } from '../utils/api';
import { Eye, EyeOff, Trash2, CheckCircle, XCircle } from 'lucide-react';

export interface PendingOffer {
    id: string;
    listing_id: string;
    offer_amount: number;
    created_at: string;
    buyer_name: string;
    buyer_initials: string;
}

interface MyListingCardProps {
    id: string;
    title: string;
    price: number;
    description: string;
    timeAgo: string;
    image?: string;
    category: string;
    views?: number;
    messageCount?: number;
    status: 'active' | 'sold' | 'hidden' | 'pending' | 'cancelled';
    sellerConfirmed?: boolean;
    buyerConfirmed?: boolean;
    pendingOffers?: PendingOffer[];
    onToggleVisibility?: (id: string, currentStatus: string) => void;
    onMarkSold?: (id: string) => void;
    onDelete?: (id: string) => void;
    onAcceptOffer?: (offerId: string) => void;
    onDeclineOffer?: (offerId: string) => void;
    onConfirmSold?: (id: string) => void;
    onReverseActive?: (id: string) => void;
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
    pendingOffers,
    onToggleVisibility,
    onMarkSold,
    onDelete,
    onAcceptOffer,
    onDeclineOffer,
    onConfirmSold,
    onReverseActive,
    sellerConfirmed = false,
    buyerConfirmed = false
}: MyListingCardProps) {
    const imageUrl = image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : null;
    const isHidden = status === 'hidden' || status === 'cancelled';
    const isSold = status === 'sold';
    const isPending = status === 'pending';

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

                {/* Overlays for Sold/Hidden/Pending */}
                {(isSold || isHidden || isPending) && (
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
                            backgroundColor: isSold ? 'rgba(212, 175, 55, 0.8)' : 
                                            isPending ? 'rgba(3, 105, 161, 0.8)' : 
                                            'rgba(128, 128, 128, 0.8)',
                            padding: '8px 24px',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: '700',
                            letterSpacing: '0.05em',
                            fontSize: '18px',
                            backdropFilter: 'blur(4px)'
                        }}>
                            {isSold ? 'SOLD' : isPending ? 'PENDING' : 'HIDDEN'}
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

                {/* Pending Offers Section */}
                {pendingOffers && pendingOffers.length > 0 && status === 'active' && (
                    <div style={{ marginTop: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '12px', border: '1px solid #bae6fd' }}>
                        <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#0369a1', marginBottom: '8px', fontWeight: '700', letterSpacing: '0.05em' }}>
                            Pending Offers
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {pendingOffers.map(offer => {
                                const offerDate = new Date(offer.created_at.endsWith('Z') ? offer.created_at : offer.created_at + 'Z');
                                const timeStr = offerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                return (
                                    <div key={offer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--vandy-black)' }}>
                                                ${offer.offer_amount} <span style={{ fontSize: '13px', color: 'var(--vandy-grey)', fontWeight: '400' }}>from {offer.buyer_name}</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--vandy-grey)' }}>{timeStr}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button 
                                                onClick={() => onAcceptOffer && onAcceptOffer(offer.id)}
                                                style={{ padding: '6px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}
                                                title="Accept Offer"
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                            <button 
                                                onClick={() => onDeclineOffer && onDeclineOffer(offer.id)}
                                                style={{ padding: '6px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}
                                                title="Decline Offer"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Pending Transaction Confirmation Status */}
                {isPending && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Sale Confirmation
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: sellerConfirmed ? '#059669' : '#94a3b8' }}>
                                <CheckCircle size={14} fill={sellerConfirmed ? '#059669' : 'transparent'} color={sellerConfirmed ? 'white' : '#94a3b8'} />
                                Seller Confirmed
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: buyerConfirmed ? '#059669' : '#94a3b8' }}>
                                <CheckCircle size={14} fill={buyerConfirmed ? '#059669' : 'transparent'} color={buyerConfirmed ? 'white' : '#94a3b8'} />
                                Buyer Confirmed
                            </div>
                        </div>
                    </div>
                )}

                {/* Metrics Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--vandy-grey)' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <span>Views: <strong>{views}</strong></span>
                        <span>Messages: <strong>{messageCount}</strong></span>
                    </div>
                    <span>{timeAgo}</span>
                </div>

                {/* Action Buttons */}
                {(onToggleVisibility || onMarkSold || onDelete || onConfirmSold || onReverseActive) && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '16px',
                        borderTop: '1px solid #f3f4f6',
                        paddingTop: '16px',
                        flexWrap: 'wrap'
                    }}>
                        {isPending && onConfirmSold && (
                            <button
                                onClick={() => onConfirmSold(id)}
                                disabled={sellerConfirmed}
                                style={{
                                    flex: '1 1 100%',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    backgroundColor: sellerConfirmed ? '#ecfdf5' : 'var(--vandy-gold)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: sellerConfirmed ? '#059669' : 'white',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: sellerConfirmed ? 'default' : 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: sellerConfirmed ? 'none' : 'var(--shadow-sm)'
                                }}
                            >
                                <CheckCircle size={18} />
                                {sellerConfirmed ? 'Confirmed' : 'Confirm Sale to Buyer'}
                            </button>
                        )}

                        {isPending && onReverseActive && (
                            <button
                                onClick={() => onReverseActive(id)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fee2e2',
                                    borderRadius: '8px',
                                    color: '#b91c1c',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <XCircle size={16} />
                                Reverse to Active
                            </button>
                        )}
                        {onToggleVisibility && (
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
                        )}

                        {onMarkSold && (
                            <button
                                onClick={() => isSold ? onToggleVisibility && onToggleVisibility(id, 'hidden') : onMarkSold(id)}
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
                        )}

                        {onDelete && (
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
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
