
import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { createListing, uploadListingImage } from '../utils/api';

interface ListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    "Clothing",
    "Furniture",
    "Electronics",
    "Books",
    "Tickets",
    "Other"
];

export default function ListingModal({ isOpen, onClose, onSuccess }: ListingModalProps) {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const imageUrls: string[] = [];

            // We will upload the image *after* the listing is created, 
            // but we need to pass an empty array initially

            const listingData = {
                title,
                price: parseFloat(price),
                description,
                category,
                images: imageUrls
            };

            const newListing = await createListing(listingData);

            // If an image was provided, upload it to the newly created listing
            if (imageFile && newListing.id) {
                await uploadListingImage(newListing.id, imageFile);
            }

            onSuccess();
            onClose();
            // Reset form
            setTitle('');
            setPrice('');
            setCategory(CATEGORIES[0]);
            setDescription('');
            setImageFile(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Failed to create listing');
            } else {
                setError('Failed to create listing');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '500px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1a1a1a' }}>Sell an Item</h2>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Image Upload */}
                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Photo</label>
                        <div style={{
                            border: '2px dashed #d1d5db',
                            borderRadius: '8px',
                            padding: '24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#f9fafb',
                            transition: 'all 0.2s'
                        }}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            {imageFile ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#059669' }}>
                                    <span style={{ fontWeight: 500 }}>{imageFile.name}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setImageFile(null); }}
                                        style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                                    >Change</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                                    <Upload size={24} />
                                    <span>Click to upload photo</span>
                                </div>
                            )}
                            <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="What are you selling?"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '16px',
                                outlineColor: '#8B7D5B'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Price ($)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="0.00"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--vandy-sand)',
                                    fontSize: '16px',
                                    outlineColor: 'var(--vandy-gold)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--vandy-black)' }}>Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--vandy-sand)',
                                    fontSize: '16px',
                                    backgroundColor: 'white',
                                    outlineColor: 'var(--vandy-gold)'
                                }}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--vandy-black)' }}>Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe your item..."
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--vandy-sand)',
                                fontSize: '16px',
                                resize: 'vertical',
                                outlineColor: 'var(--vandy-gold)',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '8px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'var(--vandy-gold)',
                                color: 'var(--vandy-black)',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {loading && <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
                            {loading ? 'Posting...' : 'Post Listing'}
                        </button>
                    </div>

                    <style jsx>{`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </form>
            </div>
        </div>
    );
}
