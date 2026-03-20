
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { createListing, updateListing, uploadListingImage, deleteListingImage, BASE_URL } from '../utils/api';

interface ListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialListing?: {
        id: string;
        title: string;
        description: string;
        price: number;
        category: string;
        images?: string[];
        image?: string; // Legacy support
    } | null;
}

const CATEGORIES = [
    "Clothing",
    "Furniture",
    "Electronics",
    "Books",
    "Tickets",
    "Other"
];

export default function ListingModal({ isOpen, onClose, onSuccess, initialListing }: ListingModalProps) {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialListing) {
            setTitle(initialListing.title);
            setPrice(initialListing.price.toString());
            setCategory(initialListing.category);
            setDescription(initialListing.description);
            // Handle both images array and legacy single image field
            const images = initialListing.images || (initialListing.image ? [initialListing.image] : []);
            setExistingImages(images);
        } else {
            setTitle('');
            setPrice('');
            setCategory(CATEGORIES[0]);
            setDescription('');
            setExistingImages([]);
        }
        setNewImageFiles([]);
        setPreviews([]);
    }, [initialListing, isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewImageFiles(prev => [...prev, ...files]);
            
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeNewImage = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previews[index]);
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = async (imageUrl: string) => {
        if (!initialListing) return;
        
        try {
            setLoading(true);
            await deleteListingImage(initialListing.id, imageUrl);
            setExistingImages(prev => prev.filter(url => url !== imageUrl));
        } catch (err: any) {
            setError(err.message || 'Failed to delete image');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const listingData = {
                title,
                price: parseFloat(price),
                description,
                category,
                images: existingImages
            };

            let listingId = initialListing?.id;

            if (initialListing) {
                 await updateListing(initialListing.id, listingData);
            } else {
                 const newListing = await createListing(listingData);
                 listingId = newListing.id;
            }

            // Upload all new images
            if (listingId && newImageFiles.length > 0) {
                for (const file of newImageFiles) {
                    await uploadListingImage(listingId, file);
                }
            }

            onSuccess();
            onClose();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Failed to save listing');
            } else {
                setError('Failed to save listing');
            }
        } finally {
            setLoading(false);
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
            backdropFilter: 'blur(4px)',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '600px',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1f2937'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '28px', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>
                    {initialListing ? 'Edit Listing' : 'Sell an Item'}
                </h2>

                {error && (
                    <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Image Grid */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#374151', fontSize: '15px' }}>Photos</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                            gap: '12px',
                            marginBottom: '10px'
                        }}>
                            {/* Existing Images */}
                            {existingImages.map((url, index) => (
                                <div key={`existing-${index}`} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                    <Image 
                                        src={url.startsWith('http') ? url : `${BASE_URL}${url}`} 
                                        alt={`Existing ${index}`} 
                                        fill 
                                        style={{ objectFit: 'cover' }} 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(url)}
                                        style={{
                                            position: 'absolute', top: '4px', right: '4px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white',
                                            border: 'none', borderRadius: '50%', width: '24px', height: '24px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            
                            {/* New Previews */}
                            {previews.map((preview, index) => (
                                <div key={`new-${index}`} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                    <Image src={preview} alt={`New ${index}`} fill style={{ objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(index)}
                                        style={{
                                            position: 'absolute', top: '4px', right: '4px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white',
                                            border: 'none', borderRadius: '50%', width: '24px', height: '24px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            {/* Add Button */}
                            <div 
                                onClick={() => document.getElementById('multi-file-upload')?.click()}
                                style={{
                                    aspectRatio: '1/1',
                                    borderRadius: '8px',
                                    border: '2px dashed #d1d5db',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: '#f9fafb',
                                    color: '#6b7280',
                                    gap: '4px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = '#9ca3af';
                                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                    e.currentTarget.style.backgroundColor = '#f9fafb';
                                }}
                            >
                                <Plus size={24} />
                                <span style={{ fontSize: '11px', fontWeight: 500 }}>Add Photo</span>
                                <input
                                    id="multi-file-upload"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>Tip: You can select multiple photos at once.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 600, color: '#374151', fontSize: '15px' }}>Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="What are you selling?"
                            style={{
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = '#8B7D5B'}
                            onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontWeight: 600, color: '#374151', fontSize: '15px' }}>Price ($)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="0.00"
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                    outline: 'none'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#8B7D5B'}
                                onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontWeight: 600, color: '#374151', fontSize: '15px' }}>Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                    backgroundColor: 'white',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#8B7D5B'}
                                onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 600, color: '#374151', fontSize: '15px' }}>Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Tell us more about your item..."
                            rows={4}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                fontSize: '16px',
                                resize: 'none',
                                outline: 'none',
                                fontFamily: 'inherit'
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = '#8B7D5B'}
                            onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '12px',
                            padding: '14px',
                            backgroundColor: '#8B7D5B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(139, 125, 91, 0.2)'
                        }}
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : (initialListing ? 'Update Listing' : 'Post Listing')}
                    </button>
                    <style jsx>{`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        .animate-spin {
                            animation: spin 1s linear infinite;
                        }
                    `}</style>
                </form>
            </div>
        </div>
    );
}
