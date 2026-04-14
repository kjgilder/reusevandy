'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import FilterBar from '../../components/FilterBar';
import ProductCard from '../../components/ProductCard';
import ListingModal from '../../components/ListingModal';
import ProductDetailModal from '../../components/ProductDetailModal';
import { Search, Loader2, LayoutGrid, List } from 'lucide-react';
import { getListings } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../page.module.css';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images?: string[];
    seller?: {
        id?: string;
        full_name?: string;
        email?: string;
        profile_picture?: string;
    };
    timeAgo?: string;
    created_at: string;
}

export default function HomePage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [detailModalItem, setDetailModalItem] = useState<Listing | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const { user } = useAuth();
    const router = useRouter();

    const fetchListings = React.useCallback(async () => {
        try {
            const filters: Record<string, string> = {};
            if (searchTerm) filters.search = searchTerm;
            if (selectedCategory !== 'All') filters.category = selectedCategory;

            const data = await getListings(filters);
            setListings(data);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    // Simple time ago helper
    const getTimeAgo = (dateString: string) => {
        const safeDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(safeDateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds <= 0) return "Just now";

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--vandy-cream)', paddingBottom: '80px' }}>
            <Navbar onSellClick={() => {
                if (!user) {
                    router.push('/login');
                    return;
                }
                setIsListingModalOpen(true);
            }} />

            <ListingModal
                isOpen={isListingModalOpen}
                onClose={() => setIsListingModalOpen(false)}
                onSuccess={fetchListings}
            />

            <ProductDetailModal
                isOpen={!!detailModalItem}
                onClose={() => setDetailModalItem(null)}
                listing={detailModalItem ? {
                    ...detailModalItem,
                    image: detailModalItem.images && detailModalItem.images.length > 0 ? detailModalItem.images[0] : undefined,
                    timeAgo: getTimeAgo(detailModalItem.created_at)
                } : null}
                onListingDeleted={fetchListings}
            />

            <main className={styles.homeMain}>
                {/* Search Bar */}
                <div className={styles.searchContainer}>
                    <Search
                        size={20}
                        color="var(--vandy-grey)"
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 1
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search for textbooks, dorm gear, electronics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {/* Filters & View Toggle */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <FilterBar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
                        </div>
                        <div className={styles.viewToggleContainer}>
                            <button 
                                className={`${styles.viewToggleButton} ${viewMode === 'list' ? styles.activeToggle : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={20} />
                            </button>
                            <button 
                                className={`${styles.viewToggleButton} ${viewMode === 'grid' ? styles.activeToggle : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--vandy-gold)" style={{ animation: 'spin 1s linear infinite' }} />
                        <style jsx>{`
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : (
                    <div 
                        className={viewMode === 'grid' ? styles.mobileGrid3 : ''}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: viewMode === 'grid' ? '8px' : '24px'
                        }}
                    >
                        {listings.map(listing => (
                            <ProductCard
                                key={listing.id}
                                id={listing.id}
                                title={listing.title}
                                price={listing.price}
                                description={listing.description}
                                seller={listing.seller?.full_name || listing.seller?.email || 'Unknown Seller'}
                                sellerId={listing.seller?.id}
                                sellerEmail={listing.seller?.email}
                                sellerProfilePicture={listing.seller?.profile_picture}
                                timeAgo={getTimeAgo(listing.created_at)}
                                category={listing.category}
                                image={listing.images && listing.images.length > 0 ? listing.images[0] : undefined}
                                images={listing.images}
                                viewMode={viewMode}
                                onClick={() => {
                                    if (!user) {
                                        router.push('/login');
                                    } else {
                                        setDetailModalItem(listing);
                                    }
                                }}
                            />
                        ))}
                        {listings.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
                                No items found. Be the first to sell something!
                            </div>
                        )}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
