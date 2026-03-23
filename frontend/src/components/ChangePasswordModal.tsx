'use client';

import { useState } from 'react';
import { changePassword } from '../utils/api';
import { KeyRound, X, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 40px 10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--vandy-sand)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const eyeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--vandy-grey)',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '400px', margin: '0 16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <KeyRound size={20} color="var(--vandy-gold)" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Change Password</h2>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={20} color="var(--vandy-grey)" />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>Password updated!</p>
            <p style={{ color: 'var(--vandy-grey)', fontSize: '14px', marginBottom: '24px' }}>
              Your password has been changed successfully.
            </p>
            <button
              onClick={handleClose}
              style={{
                backgroundColor: 'var(--vandy-gold)', color: 'white',
                border: 'none', borderRadius: '8px', padding: '10px 24px',
                fontWeight: 600, cursor: 'pointer', fontSize: '14px',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Current Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--vandy-black)' }}>
                Current Password
              </label>
              <div style={wrapperStyle}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Enter current password"
                />
                <button type="button" style={eyeButtonStyle} onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--vandy-black)' }}>
                New Password
              </label>
              <div style={wrapperStyle}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="At least 8 characters"
                />
                <button type="button" style={eyeButtonStyle} onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--vandy-black)' }}>
                Confirm New Password
              </label>
              <div style={wrapperStyle}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Repeat new password"
                />
                <button type="button" style={eyeButtonStyle} onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: '1px solid var(--vandy-sand)', background: 'white',
                  fontWeight: 600, cursor: 'pointer', fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  backgroundColor: isLoading ? 'var(--vandy-sand)' : 'var(--vandy-gold)',
                  color: 'white', border: 'none',
                  fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '14px',
                }}
              >
                {isLoading ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
