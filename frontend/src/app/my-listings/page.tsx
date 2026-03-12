'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import MyListingCard from '../../components/MyListingCard';
import DeleteModal from '../../components/DeleteModal';
import ListingModal from '../../components/ListingModal';
import { getMyListings, updateListingStatus, deleteListing } from '../../utils/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './page.module.css';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    status: 'available' | 'sold' | 'hidden';
    views: number;
    messageCount: number;
    created_at: string;
}

export default function MyListingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const isAuthenticated = !!user;
    
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [activeTab, setActiveTab] = useState<'available' | 'sold' | 'hidden'>('available');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [listingToDelete, setListingToDelete] = useState<string | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (isAuthenticated) {
            fetchListings();
        }
    }, [isAuthenticated, authLoading, router]);

    const fetchListings = async () => {
        try {
            setIsLoading(true);
            const data = await getMyListings();
            setListings(data);
        } catch (err) {
            console.error('Failed to fetch listings:', err);
            setError('Failed to load your listings. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleVisibility = async (id: string, currentStatus: string) => {
        // We use currentStatus === 'sold' as a signal to undo the sold status and make it available.
        const newStatus = (currentStatus === 'hidden' || currentStatus === 'sold') ? 'available' : 'hidden';
        try {
            await updateListingStatus(id, newStatus);
            // Optimistic update
            setListings(listings.map(l => l.id === id ? { ...l, status: newStatus } : l));
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update listing status. Please try again.');
        }
    };

    const handleMarkSold = async (id: string) => {
        try {
            await updateListingStatus(id, 'sold');
            // Optimistic update
            setListings(listings.map(l => l.id === id ? { ...l, status: 'sold' } : l));
        } catch (err) {
            console.error('Failed to mark as sold:', err);
            alert('Failed to mark listing as sold. Please try again.');
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
            // Optimistic update
            setListings(listings.filter(l => l.id !== listingToDelete));
            setDeleteModalOpen(false);
            setListingToDelete(null);
        } catch (err) {
            console.error('Failed to delete listing:', err);
            alert('Failed to delete listing. Please try again.');
        }
    };

    const getTimeAgo = (dateString: string) => {
        const safeDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(safeDateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds <= 0) return "Just now";

        let interval = seconds / 86400; // Days
        if (interval >= 1) return Math.floor(interval) + " days ago";
        
        interval = seconds / 3600; // Hours
        if (interval >= 1) return Math.floor(interval) + " hours ago";
        
        interval = seconds / 60; // Minutes
        if (interval >= 1) return Math.floor(interval) + " mins ago";

        return "Just now";
    };

    if (authLoading || isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--vandy-cream)' }}>
                <div style={{ color: 'var(--vandy-gold)', fontWeight: 'bold' }}>Loading your listings...</div>
            </div>
        );
    }

    const filteredListings = listings.filter(l => l.status === activeTab);
    const activeCount = listings.filter(l => l.status === 'available').length;
    const soldCount = listings.filter(l => l.status === 'sold').length;
    const hiddenCount = listings.filter(l => l.status === 'hidden').length;

    return (
        <div className={styles.myListingsMain}>
            <Navbar onSellClick={() => setIsSellModalOpen(true)} />

            <div className={styles.contentWrapper}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>My Listings</h1>
                    <span className={styles.totalListings}>{listings.length} total listings</span>
                </div>

                {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

                <div className={styles.segmentedControl}>
                    <button 
                        className={`${styles.segmentButton} ${activeTab === 'available' ? styles.active : ''}`}
                        onClick={() => setActiveTab('available')}
                    >
                        Active ({activeCount})
                    </button>
                    <button 
                        className={`${styles.segmentButton} ${activeTab === 'sold' ? styles.active : ''}`}
                        onClick={() => setActiveTab('sold')}
                    >
                        Sold ({soldCount})
                    </button>
                    <button 
                        className={`${styles.segmentButton} ${activeTab === 'hidden' ? styles.active : ''}`}
                        onClick={() => setActiveTab('hidden')}
                    >
                        Hidden ({hiddenCount})
                    </button>
                </div>

                {filteredListings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--vandy-grey)' }}>
                        You don't have any {activeTab} listings.
                    </div>
                ) : (
                    <div className={styles.listingsGrid}>
                        {filteredListings.map(listing => (
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
                )}
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
                        fetchListings(); // Refresh listings after creating a new one
                    }}
                />
            )}
            
            <BottomNav />
        </div>
    );
}
