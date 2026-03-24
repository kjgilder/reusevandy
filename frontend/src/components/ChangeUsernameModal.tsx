'use client';

import { useState } from 'react';
import { updateProfile } from '../utils/api';
import styles from '../app/my-listings/page.module.css';

interface ChangeUsernameModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onSuccess: (newName: string) => void;
}

export default function ChangeUsernameModal({ isOpen, onClose, currentName, onSuccess }: ChangeUsernameModalProps) {
    const [name, setName] = useState(currentName);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!name.trim()) {
            setError('Name cannot be empty');
            return;
        }

        setIsLoading(true);
        try {
            await updateProfile({ full_name: name.trim() });
            onSuccess(name.trim());
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || 'Failed to update username');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h2 className={styles.modalTitle}>Change Username</h2>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>New Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #ccc',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.deleteButton} style={{ backgroundColor: 'var(--vandy-gold)', color: 'var(--vandy-black)' }} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
