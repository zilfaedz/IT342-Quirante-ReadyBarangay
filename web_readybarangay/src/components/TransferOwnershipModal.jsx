import React, { useState } from 'react';
import { initiateTransfer } from '../services/api';
import './logoutModal.css';

const AlertIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
);

const TransferOwnershipModal = ({ show, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!show) return null;

    const handleConfirm = async () => {
        if (!name || !email || !contact || !file) {
            setError("All fields (Name, Email, Contact, Proof of Election) are required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("newCaptainName", name);
            formData.append("newCaptainEmail", email);
            formData.append("newCaptainContactNumber", contact);
            formData.append("proofDocument", file);

            await initiateTransfer(formData);

            alert("Transfer request submitted successfully! An email has been sent to the new captain for verification.");
            onClose(true); // close and refresh or state clear

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data || "Failed to initiate transfer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="logout-modal-overlay" style={{ zIndex: 1100 }} onClick={() => onClose(false)}>
            <div className="logout-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>

                <div className="logout-modal-header">
                    <div className="logout-modal-icon" style={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', color: 'var(--red-600)', borderColor: 'rgba(211, 47, 47, 0.05)' }}>
                        <AlertIcon />
                    </div>
                    <h3 style={{ color: 'var(--red-700)' }}>Initiate Ownership Transfer</h3>
                </div>

                <div className="logout-modal-divider" />

                <div className="logout-modal-body" style={{ textAlign: 'left' }}>
                    <p style={{ color: 'var(--gray-800)', marginBottom: '15px' }}>
                        Please enter the details of the newly elected Barangay Captain. They will receive an email to verify their identity.
                    </p>

                    {error && (
                        <div style={{ backgroundColor: 'var(--red-50)', color: 'var(--red-600)', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>New Captain Full Name</label>
                            <input
                                type="text"
                                className="rb-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Juan Dela Cruz"
                                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Email Address</label>
                            <input
                                type="email"
                                className="rb-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Contact Number</label>
                            <input
                                type="text"
                                className="rb-input"
                                value={contact}
                                onChange={e => setContact(e.target.value)}
                                placeholder="e.g. 09123456789"
                                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Proof of New Election <br /><span style={{ fontWeight: 'normal', fontSize: '11px', color: 'gray' }}>(Barangay Resolution OR Cert of Election) PDF/JPG/PNG</span></label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => setFile(e.target.files[0])}
                                style={{ width: '100%', padding: '4px' }}
                            />
                        </div>
                    </div>

                    <p style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>
                        WARNING: Admin approval is required. Once approved, you will immediately be demoted to FORMER CAPTAIN and logged out of the command center.
                    </p>
                </div>

                <div className="logout-modal-footer">
                    <button className="logout-modal-btn cancel-btn" onClick={() => onClose(false)} disabled={loading}>
                        Cancel
                    </button>
                    <button className="logout-modal-btn logout-btn" style={{ backgroundColor: 'var(--red-600)' }} onClick={handleConfirm} disabled={loading}>
                        {loading ? "Submitting..." : "Initiate Transfer"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TransferOwnershipModal;
