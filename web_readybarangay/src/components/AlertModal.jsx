import React from 'react';
import './logoutModal.css'; // Reusing modal styles

const InfoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const AlertModal = ({ show, title, message, onClose }) => {
    if (!show) return null;

    return (
        <div className="logout-modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
            <div className="logout-modal-content" onClick={e => e.stopPropagation()}>

                <div className="logout-modal-header" style={{ paddingBottom: '0.2rem' }}>
                    <div className="logout-modal-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber-600)', border: '8px solid rgba(245, 158, 11, 0.05)' }}>
                        <InfoIcon />
                    </div>
                    <h3 style={{ color: 'var(--text-dark)' }}>{title}</h3>
                </div>

                <div className="logout-modal-body" style={{ paddingTop: '1rem', paddingBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--gray-700)', fontSize: '0.95rem' }}>{message}</p>
                </div>

                <div className="logout-modal-footer">
                    <button
                        className="logout-modal-btn logout-btn"
                        style={{ backgroundColor: 'var(--amber-600)', color: 'white', width: '100%', flex: 'none', maxWidth: '200px', margin: '0 auto' }}
                        onClick={onClose}
                    >
                        Okay, got it
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AlertModal;
