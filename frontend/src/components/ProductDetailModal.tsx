import React, { useState } from 'react';
import Image from 'next/image';
import { X, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BASE_URL, sendOffer, deleteListing, initiateConversation } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DeleteModal from './DeleteModal';
import ListingModal from './ListingModal';

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing: {
        id: string;
        title: string;
        description: string;
        price: number;
        category: string;
        images?: string[];
        image?: string;
        seller?: {
            id?: string;
            full_name?: string;
            email?: string;
            profile_picture?: string;
        };
        timeAgo: string;
    } | null;
    onListingDeleted?: () => void;
    hideActions?: boolean;
}

export default function ProductDetailModal({ isOpen, onClose, listing, onListingDeleted, hideActions = false }: ProductDetailModalProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [offerAmount, setOfferAmount] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    if (!isOpen || !listing) return null;

    const images = listing.images || (listing.image ? [listing.image] : []);
    const isOwner = user && listing.seller && (user.id === listing.seller.id || user.email === listing.seller.email);

    const handleSendOffer = async () => {
        const finalAmount = offerAmount ? offerAmount : listing.price.toString();

        if (isNaN(Number(finalAmount))) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            setIsSending(true);
            setError('');
            await sendOffer({
                listing_id: listing.id,
                offer_amount: Number(offerAmount),
                message: `I'd like to offer $${offerAmount} for the ${listing.title}`
            });
            setSuccess('Offer sent successfully!');
            setTimeout(() => {
                onClose();
                setSuccess('');
                setOfferAmount('');
            }, 2000);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || 'Failed to send offer');
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteListing(listing.id);
            setShowDeleteConfirm(false);
            onClose();
            if (onListingDeleted) onListingDeleted();
        } catch (err) {
            console.error(err);
            alert("Failed to delete listing.");
        }
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'var(--vandy-cream)',
                borderRadius: '20px',
                width: 'calc(100% - 32px)',
                maxWidth: '550px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(139, 125, 91, 0.2)',
                margin: 'auto'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '8px',
                        cursor: 'pointer',
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: 'var(--vandy-black)'
                    }}
                >
                    <X size={20} />
                </button>

                {/* Carousel Container */}
                <div style={{ height: 'clamp(250px, 45vh, 350px)', width: '100%', position: 'relative', backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
                    {images.length > 0 ? (
                        <>
                            <Image 
                                src={images[currentImageIndex].startsWith('http') ? images[currentImageIndex] : `${BASE_URL}${images[currentImageIndex]}`} 
                                alt={`${listing.title} - ${currentImageIndex + 1}`} 
                                fill 
                                style={{ objectFit: 'contain' }} 
                            />
                            
                            {images.length > 1 && (
                                <>
                                    <button 
                                        onClick={prevImage}
                                        style={{
                                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                            backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
                                            padding: '8px', cursor: 'pointer', zIndex: 10, display: 'flex'
                                        }}
                                    >
                                        <ChevronLeft size={24} color="var(--vandy-black)" />
                                    </button>
                                    <button 
                                        onClick={nextImage}
                                        style={{
                                            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                            backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
                                            padding: '8px', cursor: 'pointer', zIndex: 10, display: 'flex'
                                        }}
                                    >
                                        <ChevronRight size={24} color="var(--vandy-black)" />
                                    </button>
                                    
                                    {/* Pagination Dots */}
                                    <div style={{
                                        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                                        display: 'flex', gap: '8px', zIndex: 10
                                    }}>
                                        {images.map((_, i) => (
                                            <div 
                                                key={i} 
                                                style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    backgroundColor: i === currentImageIndex ? 'var(--vandy-gold)' : 'rgba(255,255,255,0.5)',
                                                    transition: 'all 0.3s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--vandy-grey)' }}>
                            No Image Available
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div style={{ padding: 'clamp(16px, 4vw, 24px)', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <span style={{
                                backgroundColor: 'var(--vandy-black)',
                                color: 'var(--vandy-gold)',
                                padding: '4px 14px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                display: 'inline-block',
                                marginBottom: '16px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>{listing.category}</span>
                            <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontFamily: 'Outfit, sans-serif', fontWeight: '800' }}>{listing.title}</h2>
                            <p style={{ margin: 0, color: '#4b5563', fontSize: '15px', lineHeight: '1.6' }}>{listing.description}</p>
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--vandy-gold)', marginLeft: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            ${listing.price}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7280', fontSize: '14px', marginTop: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {listing.seller?.profile_picture ? (
                                <div style={{ 
                                    position: 'relative', 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    overflow: 'hidden',
                                    border: '1px solid var(--vandy-gold)'
                                }}>
                                    <Image 
                                        src={listing.seller.profile_picture.startsWith('http') ? listing.seller.profile_picture : `${BASE_URL}${listing.seller.profile_picture}`} 
                                        alt={listing.seller.full_name || 'Seller'} 
                                        fill 
                                        style={{ objectFit: 'cover' }}
                                        sizes="32px"
                                    />
                                </div>
                            ) : (
                                <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    backgroundColor: 'var(--vandy-gold)', 
                                    color: 'white', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontWeight: '800',
                                    fontSize: '12px'
                                }}>
                                    {(listing.seller?.full_name || listing.seller?.email || '?').substring(0, 1).toUpperCase()}
                                </div>
                            )}
                            <span>Seller: <strong style={{ color: 'var(--vandy-black)' }}>{listing.seller?.full_name || listing.seller?.email || 'Unknown'}</strong></span>
                        </div>
                        <span>Listed {listing.timeAgo}</span>
                    </div>

                    {/* Actions Panel */}
                    {!hideActions && (
                    <div style={{ marginTop: '28px' }}>
                        {isOwner ? (
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    style={{
                                        flex: 2,
                                        padding: '14px',
                                        backgroundColor: 'white',
                                        border: '2px solid var(--vandy-gold)',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        color: 'var(--vandy-black)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 125, 91, 0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <Edit size={18} /> Edit Listing
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        backgroundColor: '#fee2e2',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                >
                                    <Trash2 size={18} /> Delete
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0', color: 'var(--vandy-black)' }}>Make an Offer</h3>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#111827' }}>$</span>
                                            <input
                                                type="number"
                                                value={offerAmount}
                                                onChange={(e) => setOfferAmount(e.target.value)}
                                                placeholder={listing.price.toString()}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px 14px 32px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #d1d5db',
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    transition: 'border-color 0.2s'
                                                }}
                                                onFocus={e => e.currentTarget.style.borderColor = 'var(--vandy-gold)'}
                                                onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const amountToSend = offerAmount ? offerAmount : listing.price.toString();
                                                setOfferAmount(amountToSend);
                                                setTimeout(() => {
                                                    const btn = document.getElementById('hidden-offer-btn');
                                                    if (btn) btn.click();
                                                }, 10);
                                            }}
                                            disabled={isSending}
                                            style={{
                                                padding: '14px 28px',
                                                backgroundColor: 'var(--vandy-gold)',
                                                color: 'var(--vandy-black)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '16px',
                                                cursor: isSending ? 'not-allowed' : 'pointer',
                                                opacity: isSending ? 0.6 : 1,
                                                boxShadow: '0 4px 6px -1px rgba(139, 125, 91, 0.3)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => !isSending && (e.currentTarget.style.transform = 'translateY(-1px)')}
                                            onMouseLeave={e => !isSending && (e.currentTarget.style.transform = 'translateY(0)')}
                                        >
                                            {isSending ? 'Sending...' : 'Send Offer'}
                                        </button>
                                        
                                        {/* Hidden button to perform the actual submit with the updated state */}
                                        <button
                                            id="hidden-offer-btn"
                                            style={{ display: 'none' }}
                                            onClick={handleSendOffer}
                                        />
                                    </div>
                                    <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                                        Tip: You can negotiate below the asking price
                                    </p>
                                </div>

                                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '24px', paddingTop: '24px', display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={async () => {
                                            try {
                                                setIsSending(true);
                                                setError('');
                                                const conv = await initiateConversation({
                                                    listing_id: listing.id
                                                });
                                                onClose();
                                                router.push(`/messages?conversationId=${conv.id}`);
                                            } catch (err: unknown) {
                                                const error = err as { message?: string };
                                                setError(error.message || 'Failed to start conversation');
                                            } finally {
                                                setIsSending(false);
                                            }
                                        }}
                                        disabled={isSending}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: 'transparent',
                                            color: '#6b7280',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: isSending ? 'not-allowed' : 'pointer',
                                            opacity: isSending ? 0.5 : 1,
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Ask a question
                                    </button>
                                </div>


                                {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '16px', textAlign: 'center', fontWeight: '600' }}>{error}</p>}
                                {success && <p style={{ color: '#10b981', fontSize: '14px', marginTop: '16px', textAlign: 'center', fontWeight: '700' }}>{success}</p>}
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            <DeleteModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
            />

            {showEditModal && (
                <ListingModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    initialListing={listing}
                    onSuccess={() => {
                        setShowEditModal(false);
                        onClose();
                        if (onListingDeleted) onListingDeleted(); // Trigger refresh on parent
                    }}
                />
            )}
        </div>
    );
}
