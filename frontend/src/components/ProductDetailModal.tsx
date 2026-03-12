import React, { useState } from 'react';
import Image from 'next/image';
import { X, Edit, Trash2 } from 'lucide-react';
import { BASE_URL, sendOffer, deleteListing, initiateConversation } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import styles from '../app/my-listings/page.module.css'; // Reuse some modal styles
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
        image?: string;
        seller?: {
            id?: string;
            full_name?: string;
            email?: string;
        };
        timeAgo: string;
    } | null;
    onListingDeleted?: () => void;
}

export default function ProductDetailModal({ isOpen, onClose, listing, onListingDeleted }: ProductDetailModalProps) {
    const { user } = useAuth();
    const [offerAmount, setOfferAmount] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    if (!isOpen || !listing) return null;

    const imageUrl = listing.image ? (listing.image.startsWith('http') ? listing.image : `${BASE_URL}${listing.image}`) : null;
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
        } catch (err: any) {
            setError(err.message || 'Failed to send offer');
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

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'var(--vandy-cream)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '8px',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    <X size={20} color="var(--vandy-black)" />
                </button>

                <div style={{ height: '300px', width: '100%', position: 'relative', backgroundColor: '#e5e7eb' }}>
                    {imageUrl ? (
                        <Image src={imageUrl} alt={listing.title} fill style={{ objectFit: 'cover' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--vandy-grey)' }}>
                            No Image Available
                        </div>
                    )}
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <span style={{ 
                                backgroundColor: 'var(--vandy-black)', 
                                color: 'white', 
                                padding: '4px 12px', 
                                borderRadius: '16px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'inline-block',
                                marginBottom: '12px'
                            }}>{listing.category}</span>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>{listing.title}</h2>
                            <p style={{ margin: 0, color: 'var(--vandy-grey)', fontSize: '14px' }}>{listing.description}</p>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--vandy-gold)', marginLeft: '16px' }}>
                            ${listing.price}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--vandy-grey)', fontSize: '13px', marginTop: '16px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                        <span>Seller: <strong>{listing.seller?.full_name || listing.seller?.email || 'Unknown'}</strong></span>
                        <span>Listed: {listing.timeAgo}</span>
                    </div>

                    {/* Actions Panel */}
                    <div style={{ marginTop: '24px' }}>
                        {isOwner ? (
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        color: 'var(--vandy-black)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Edit size={16} /> Edit Listing
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: '#fee2e2',
                                        border: '1px solid #fca5a5',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>Make an Offer or Message Seller</h3>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>$</span>
                                        <input
                                            type="number"
                                            value={offerAmount}
                                            onChange={(e) => setOfferAmount(e.target.value)}
                                            placeholder={listing.price.toString()}
                                            style={{
                                                width: '100%',
                                                padding: '12px 12px 12px 28px',
                                                borderRadius: '8px',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const amountToSend = offerAmount ? offerAmount : listing.price.toString();
                                            // Instead of failing, just set the state and then call the real handler immediately
                                            setOfferAmount(amountToSend);
                                            setTimeout(() => {
                                                const btn = document.getElementById('hidden-offer-btn');
                                                if(btn) btn.click();
                                            }, 10);
                                        }}
                                        disabled={isSending}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: 'var(--vandy-gold)',
                                            color: 'var(--vandy-black)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '700',
                                            fontSize: '15px',
                                            cursor: isSending ? 'not-allowed' : 'pointer',
                                            opacity: isSending ? 0.5 : 1
                                        }}
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
                                
                                <button
                                     onClick={async () => {
                                        try {
                                             setIsSending(true);
                                             setError('');
                                             await initiateConversation({
                                                 listing_id: listing.id,
                                                 content: `Hi, I'm interested in the ${listing.title}.` 
                                             });
                                             setSuccess('Message sent successfully!');
                                             setTimeout(() => {
                                                 onClose();
                                             }, 2000);
                                         } catch (err: any) {
                                             setError(err.message || 'Failed to send message');
                                         } finally {
                                             setIsSending(false);
                                         }
                                     }}
                                     disabled={isSending}
                                     style={{
                                         width: '100%',
                                         padding: '12px',
                                         backgroundColor: 'white',
                                         border: '1px solid #e5e7eb',
                                         borderRadius: '8px',
                                         fontWeight: '600',
                                         color: 'var(--vandy-black)',
                                         cursor: isSending ? 'not-allowed' : 'pointer',
                                         opacity: isSending ? 0.5 : 1,
                                         display: 'flex',
                                         justifyContent: 'center',
                                         alignItems: 'center',
                                         gap: '8px'
                                     }}
                                >
                                    Message Seller
                                </button>

                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--vandy-grey)' }}>
                                    Tip: You can negotiate below the asking price
                                </p>
                                
                                {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
                                {success && <p style={{ color: 'green', fontSize: '13px', marginTop: '12px', fontWeight: '600' }}>{success}</p>}
                            </div>
                        )}
                    </div>
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
