'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import MyListingCard from '../../components/MyListingCard';
import DeleteModal from '../../components/DeleteModal';
import ListingModal from '../../components/ListingModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import {
    getMyListings,
    getPurchasedListings,
    updateListingStatus,
    deleteListing,
    getPendingOffers,
    updateOfferStatus,
    uploadProfilePicture,
    confirmTransaction,
    revertToActive
} from '../../utils/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './page.module.css';
import { PendingOffer } from '../../components/MyListingCard';
import { ChevronDown, ChevronUp, Package, ShoppingBag, Camera, LogOut, KeyRound } from 'lucide-react';
import Image from 'next/image';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    status: 'active' | 'sold' | 'hidden' | 'pending' | 'cancelled';
    seller_confirmed_sold?: boolean;
    buyer_confirmed_sold?: boolean;
    views: number;
    messageCount: number;
    created_at: string;
    pendingOffers?: PendingOffer[];
}

export default function MyListingsPage() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const isAuthenticated = !!user;

    const [listings, setListings] = useState<Listing[]>([]);
    const [purchasedListings, setPurchasedListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [listingToDelete, setListingToDelete] = useState<string | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const [isSoldExpanded, setIsSoldExpanded] = useState(false);
    const [isPurchasedExpanded, setIsPurchasedExpanded] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, authLoading, router]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [listingsData, offersData, purchasedData] = await Promise.all([
                getMyListings(),
                getPendingOffers(),
                getPurchasedListings()
            ]);

            // Map offers to listings
            const listingsWithOffers = listingsData.map((listing: Listing) => {
                const listingOffers = offersData.filter((offer: PendingOffer) => offer.listing_id === listing.id);
                return { ...listing, pendingOffers: listingOffers };
            });

            setListings(listingsWithOffers);
            setPurchasedListings(purchasedData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load your information. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptOffer = async (offerId: string) => {
        try {
            await updateOfferStatus(offerId, 'accepted');
            await fetchData(); // Refresh all to update status and potentially sold items
        } catch (err) {
            console.error('Failed to accept offer:', err);
            alert('Failed to accept offer. Please try again.');
        }
    };

    const handleDeclineOffer = async (offerId: string, listingId: string) => {
        try {
            await updateOfferStatus(offerId, 'declined');
            setListings(listings.map(l => l.id === listingId ? { ...l, pendingOffers: l.pendingOffers?.filter(o => o.id !== offerId) } : l));
        } catch (err) {
            console.error('Failed to decline offer:', err);
            alert('Failed to decline offer. Please try again.');
        }
    };

    const handleToggleVisibility = async (id: string, currentStatus: string) => {
        const newStatus = (currentStatus === 'hidden' || currentStatus === 'sold') ? 'active' : 'hidden';
        try {
            await updateListingStatus(id, newStatus);
            setListings(listings.map(l => l.id === id ? { ...l, status: newStatus as Listing['status'] } : l));
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update listing status. Please try again.');
        }
    };

    const handleMarkSold = async (id: string) => {
        try {
            await updateListingStatus(id, 'sold');
            await fetchData();
        } catch (err) {
            console.error('Failed to mark as sold:', err);
            alert('Failed to mark listing as sold. Please try again.');
        }
    };

    const handleConfirmSold = async (id: string) => {
        try {
            await confirmTransaction(id);
            await fetchData();
        } catch (err) {
            console.error('Failed to confirm sale:', err);
            alert('Failed to confirm sale. Please try again.');
        }
    };

    const handleRevertActive = async (id: string) => {
        try {
            await revertToActive(id);
            await fetchData();
        } catch (err) {
            console.error('Failed to revert listing:', err);
            alert('Failed to revert listing. Please try again.');
        }
    };

    const openDeleteModal = (id: string) => {
        setListingToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!listingToDelete) return;
        try {
            await deleteListing(listingToDelete);
            setListings(listings.filter(l => l.id !== listingToDelete));
            setDeleteModalOpen(false);
            setListingToDelete(null);
        } catch (err) {
            console.error('Failed to delete listing:', err);
            alert('Failed to delete listing. Please try again.');
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await uploadProfilePicture(file);
            window.location.reload(); // Quickest way to refresh AuthContext user
        } catch (err) {
            console.error('Failed to upload profile picture:', err);
            alert('Failed to upload picture. Please try again.');
        }
    };

    const getTimeAgo = (dateString: string) => {
        const safeDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(safeDateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds <= 0) return "Just now";
        let interval = seconds / 86400;
        if (interval >= 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval >= 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval >= 1) return Math.floor(interval) + " mins ago";
        return "Just now";
    };

    if (authLoading || isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--vandy-cream)' }}>
                <div style={{ color: 'var(--vandy-gold)', fontWeight: 'bold' }}>Loading your profile...</div>
            </div>
        );
    }

    const activeListings = listings.filter(l => l.status === 'active' || l.status === 'pending');
    const soldListings = listings.filter(l => l.status === 'sold');
    const hiddenListings = listings.filter(l => l.status === 'hidden' || l.status === 'cancelled');

    const getInitials = (name: string, email: string) => {
        const str = name || email;
        if (!str) return "?";
        return str.substring(0, 2).toUpperCase();
    };

    return (
        <div className={styles.myListingsMain}>
            <Navbar onSellClick={() => setIsSellModalOpen(true)} />

            <div className={styles.contentWrapper}>
                {/* Profile Section */}
                <div className={styles.profileSection}>
                    <div className={styles.avatarContainer} onClick={handleAvatarClick}>
                        <div className={styles.avatar}>
                            {user?.profile_picture ? (
                                <Image src={user.profile_picture} alt="Profile" width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                getInitials(user?.full_name || '', user?.email || '')
                            )}
                        </div>
                        <div className={styles.avatarOverlay}>
                            <Camera size={24} />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>
                    <div className={styles.profileInfo}>
                        <h2>{user?.full_name || 'Set Your Name'}</h2>
                        <p>{user?.email}</p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button
                                onClick={logout}
                                className={styles.cancelButton}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '13px' }}
                            >
                                <LogOut size={14} /> Logout
                            </button>
                            <button
                                onClick={() => setIsChangePasswordOpen(true)}
                                className={styles.cancelButton}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '13px' }}
                            >
                                <KeyRound size={14} /> Change Password
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

                {/* Active Listings Section */}
                <div className={styles.sectionHeader}>
                    <Package size={20} />
                    Active Listings ({activeListings.length})
                </div>

                {activeListings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--vandy-grey)', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed var(--vandy-sand)' }}>
                        You don&apos;t have any items currently listed.
                    </div>
                ) : (
                    <div className={styles.listingsGrid}>
                        {activeListings.map(listing => (
                            <MyListingCard
                                key={listing.id}
                                id={listing.id}
                                title={listing.title}
                                price={listing.price}
                                description={listing.description}
                                timeAgo={getTimeAgo(listing.created_at)}
                                image={listing.images[0]}
                                category={listing.category}
                                views={listing.views}
                                messageCount={listing.messageCount}
                                status={listing.status}
                                sellerConfirmed={listing.seller_confirmed_sold}
                                buyerConfirmed={listing.buyer_confirmed_sold}
                                pendingOffers={listing.pendingOffers}
                                onToggleVisibility={handleToggleVisibility}
                                onMarkSold={handleMarkSold}
                                onDelete={openDeleteModal}
                                onAcceptOffer={(offerId) => handleAcceptOffer(offerId)}
                                onDeclineOffer={(offerId) => handleDeclineOffer(offerId, listing.id)}
                                onConfirmSold={handleConfirmSold}
                                onReverseActive={handleRevertActive}
                            />
                        ))}
                    </div>
                )}

                {/* Hidden Listings (if any) */}
                {hiddenListings.length > 0 && (
                    <>
                        <div className={styles.sectionHeader} style={{ marginTop: '40px' }}>
                            Hidden Listings ({hiddenListings.length})
                        </div>
                        <div className={styles.listingsGrid}>
                            {hiddenListings.map(listing => (
                                <MyListingCard
                                    key={listing.id}
                                    id={listing.id}
                                    title={listing.title}
                                    price={listing.price}
                                    description={listing.description}
                                    timeAgo={getTimeAgo(listing.created_at)}
                                    image={listing.images[0]}
                                    category={listing.category}
                                    views={listing.views}
                                    messageCount={listing.messageCount}
                                    status={listing.status}
                                    onToggleVisibility={handleToggleVisibility}
                                    onMarkSold={handleMarkSold}
                                    onDelete={openDeleteModal}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Sold Items Accordion */}
                <div className={styles.accordion} style={{ marginTop: '60px' }}>
                    <div className={styles.accordionHeader} onClick={() => setIsSoldExpanded(!isSoldExpanded)}>
                        <h2><Package size={20} color="var(--vandy-gold)" /> Items You&apos;ve Sold ({soldListings.length})</h2>
                        {isSoldExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    {isSoldExpanded && (
                        <div className={styles.accordionContent}>
                            {soldListings.length === 0 ? (
                                <p style={{ color: 'var(--vandy-grey)', textAlign: 'center', padding: '20px' }}>No items sold yet.</p>
                            ) : (
                                <div className={styles.listingsGrid} style={{ paddingBottom: 0 }}>
                                    {soldListings.map(listing => (
                                        <MyListingCard
                                            key={listing.id}
                                            id={listing.id}
                                            title={listing.title}
                                            price={listing.price}
                                            description={listing.description}
                                            timeAgo={getTimeAgo(listing.created_at)}
                                            image={listing.images[0]}
                                            category={listing.category}
                                            views={listing.views}
                                            messageCount={listing.messageCount}
                                            status={listing.status}
                                            onToggleVisibility={handleToggleVisibility}
                                            onDelete={openDeleteModal}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Purchased Items Accordion */}
                <div className={styles.accordion}>
                    <div className={styles.accordionHeader} onClick={() => setIsPurchasedExpanded(!isPurchasedExpanded)}>
                        <h2><ShoppingBag size={20} color="var(--vandy-gold)" /> Items You&apos;ve Purchased ({purchasedListings.length})</h2>
                        {isPurchasedExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    {isPurchasedExpanded && (
                        <div className={styles.accordionContent}>
                            {purchasedListings.length === 0 ? (
                                <p style={{ color: 'var(--vandy-grey)', textAlign: 'center', padding: '20px' }}>No items purchased yet.</p>
                            ) : (
                                <div className={styles.listingsGrid} style={{ paddingBottom: 0 }}>
                                    {purchasedListings.map(listing => (
                                        <MyListingCard
                                            key={listing.id}
                                            id={listing.id}
                                            title={listing.title}
                                            price={listing.price}
                                            description={listing.description}
                                            timeAgo={getTimeAgo(listing.created_at)}
                                            image={listing.images[0]}
                                            category={listing.category}
                                            views={listing.views}
                                            messageCount={listing.messageCount}
                                            status="sold"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />

            {isSellModalOpen && (
                <ListingModal
                    isOpen={isSellModalOpen}
                    onClose={() => setIsSellModalOpen(false)}
                    onSuccess={() => {
                        setIsSellModalOpen(false);
                        fetchData();
                    }}
                />
            )}

            <BottomNav />

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />
        </div>
    );
}
