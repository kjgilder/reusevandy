import styles from '../app/my-listings/page.module.css';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteModal({ isOpen, onClose, onConfirm }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3 className={styles.modalTitle}>Delete Listing</h3>
                <p className={styles.modalText}>
                    Are you sure you want to delete this listing? This action cannot be undone.
                </p>
                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button className={styles.deleteButton} onClick={onConfirm}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
