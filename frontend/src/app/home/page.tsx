'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import FilterBar from '../../components/FilterBar';
import ProductCard from '../../components/ProductCard';
import ListingModal from '../../components/ListingModal';
import { Search, Loader2 } from 'lucide-react';
import { getListings } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images?: string[];
    seller?: {
        full_name?: string;
        email?: string;
    };
    created_at: string;
}

export default function HomePage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
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
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

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
        <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9', paddingBottom: '80px' }}>
            <Navbar onSellClick={() => {
                if (!user) {
                    router.push('/login');
                    return;
                }
                setIsModalOpen(true);
            }} />

            <ListingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchListings}
            />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Search size={20} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            fontSize: '16px',
                            backgroundColor: '#f5f5f5'
                        }}
                    />
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <FilterBar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <Loader2 className="animate-spin" size={32} color="#8B7D5B" style={{ animation: 'spin 1s linear infinite' }} />
                        <style jsx>{`
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '24px'
                    }}>
                        {listings.map(listing => (
                            <ProductCard
                                key={listing.id}
                                title={listing.title}
                                price={listing.price}
                                description={listing.description}
                                seller={listing.seller?.full_name || listing.seller?.email || 'Unknown Seller'}
                                timeAgo={getTimeAgo(listing.created_at)}
                                category={listing.category}
                                image={listing.images && listing.images.length > 0 ? listing.images[0] : undefined}
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
