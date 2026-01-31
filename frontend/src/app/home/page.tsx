'use client';

import React from 'react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import FilterBar from '../../components/FilterBar';
import ProductCard from '../../components/ProductCard';
import { Search } from 'lucide-react';

const MOCK_PRODUCTS = [
    {
        id: 1,
        title: "IKEA Desk - Excellent Condition",
        price: 45,
        description: "Moving out! Selling my desk that I used for 2 years. Perfect for dorm rooms.",
        seller: "Sarah Johnson",
        timeAgo: "2 hours ago",
        category: "Furniture"
    },
    {
        id: 2,
        title: "Mini Fridge - Perfect for Dorms",
        price: 80,
        description: "Compact mini fridge, barely used. Great for keeping snacks and drinks cold.",
        seller: "Mike Chen",
        timeAgo: "5 hours ago",
        category: "Electronics"
    },
    {
        id: 3,
        title: "2x Drake Concert Tickets - Floor Seats",
        price: 150,
        description: "Can't make it to the concert anymore. Selling 2 tickets together. Great seats!",
        seller: "Emily Davis",
        timeAgo: "1 day ago",
        category: "Tickets"
    },
    {
        id: 4,
        title: "Calculus Textbook",
        price: 30,
        description: "Calculus: Early Transcendentals. Good condition, no highlighting.",
        seller: "John Doe",
        timeAgo: "1 day ago",
        category: "Textbooks"
    }
];

export default function HomePage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9', paddingBottom: '80px' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Search size={20} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search items..."
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
                    <FilterBar />
                </div>

                {/* Product Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                }}>
                    {MOCK_PRODUCTS.map(product => (
                        <ProductCard
                            key={product.id}
                            title={product.title}
                            price={product.price}
                            description={product.description}
                            seller={product.seller}
                            timeAgo={product.timeAgo}
                            category={product.category}
                        />
                    ))}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
