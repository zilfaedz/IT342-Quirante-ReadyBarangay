import React, { useState, useEffect } from "react";
import api, { getPendingTransfers, approveTransferSubmit, rejectTransferSubmit } from "../services/api";
import { Users, Eye, CheckCircle, XCircle, FileText, X, Activity } from "lucide-react";

function DocumentPreview({ title, url, onImageClick }) {
    if (!url) return null;
    const isPdf = url.toLowerCase().endsWith('.pdf');
    const fullUrl = `http://localhost:8080/uploads/transfers/${url}`;

    return (
        <div className="document-card">
            <span className="document-title">{title}</span>
            <div className="document-preview">
                {isPdf ? (
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                        <FileText size={48} />
                        <br />View PDF
                    </a>
                ) : (
                    <div className="image-preview-container" onClick={() => onImageClick(fullUrl, title)}>
                        <img src={fullUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                        <div className="image-overlay">
                            <Eye size={24} color="white" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ImageModal({ url, title, onClose }) {
    if (!url) return null;

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = title.replace(/\s+/g, '_') + '_Document';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="image-modal-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <div className="image-modal-header">
                    <h3>{title}</h3>
                    <div className="image-modal-actions">
                        <button className="download-btn" onClick={handleDownload}>Download</button>
                        <button className="close-btn" onClick={onClose}><X size={24} /></button>
                    </div>
                </div>
                <div className="image-modal-body">
                    <img src={url} alt={title} className="full-size-image" />
                </div>
            </div>
        </div>
    );
}

export default function AdminTransfersScreen() {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [modalImage, setModalImage] = useState(null);

    // For rejection reason
    const [showRejectPrompt, setShowRejectPrompt] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const res = await getPendingTransfers();
            setTransfers(res.data);
        } catch (err) {
            console.error("Failed to fetch transfers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransfers();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm("Are you sure you want to approve this transfer? The old captain will be demoted.")) return;

        setActionLoading(true);
        try {
            await approveTransferSubmit(id);
            alert("Transfer approved successfully.");
            setSelectedTransfer(null);
            fetchTransfers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve transfer');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;

        setActionLoading(true);
        try {
            await rejectTransferSubmit(selectedTransfer.id, rejectReason);
            alert("Transfer rejected successfully.");
            setRejectReason("");
            setShowRejectPrompt(false);
            setSelectedTransfer(null);
            fetchTransfers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject transfer');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="loader">Loading Transfers...</div>;

    return (
        <div className="admin-verification-page" style={{ padding: 0, minHeight: 'auto', background: 'transparent' }}>

            <div className="admin-stats-container">
                <div className="stat-card" style={{ borderLeft: '4px solid var(--purple-500)' }}>
                    <div className="stat-icon" style={{ background: 'var(--purple-100)', color: 'var(--purple-600)' }}><Activity size={24} /></div>
                    <div className="stat-content">
                        <h3>Pending Transfers</h3>
                        <p>{transfers.length}</p>
                    </div>
                </div>
            </div>

            <div className="admin-content-section rb-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Barangay</th>
                            <th>Old Captain</th>
                            <th>New Captain</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.map(t => (
                            <tr key={t.id}>
                                <td>#{t.id}</td>
                                <td>{t.barangayName}</td>
                                <td>{t.oldCaptain ? `${t.oldCaptain.firstName} ${t.oldCaptain.lastName}` : 'N/A'}</td>
                                <td>{t.newCaptainName}</td>
                                <td>
                                    <span className={`status-badge pending`}>
                                        <div className={`status-indicator pending`} />
                                        Pending
                                    </span>
                                </td>
                                <td>
                                    <button className="action-btn" onClick={() => setSelectedTransfer(t)}>
                                        <Eye size={16} /> View
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {transfers.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No pending transfers found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedTransfer && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Transfer Details: {selectedTransfer.barangayName}</h2>
                            <button className="close-btn" onClick={() => setSelectedTransfer(null)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="info-grid">
                                <div className="info-section">
                                    <h3><Users size={18} /> Old Captain Info</h3>
                                    <div className="info-row"><span className="info-label">Name</span><span className="info-value">{selectedTransfer.oldCaptain?.firstName} {selectedTransfer.oldCaptain?.lastName}</span></div>
                                    <div className="info-row"><span className="info-label">Email</span><span className="info-value">{selectedTransfer.oldCaptain?.email}</span></div>
                                </div>
                                <div className="info-section" style={{ borderLeft: '4px solid var(--green-500)', paddingLeft: '15px' }}>
                                    <h3><Users size={18} color="var(--green-600)" /> New Captain Info</h3>
                                    <div className="info-row"><span className="info-label">Name</span><span className="info-value">{selectedTransfer.newCaptainName}</span></div>
                                    <div className="info-row"><span className="info-label">Contact</span><span className="info-value">{selectedTransfer.newCaptainContactNumber}</span></div>
                                    <div className="info-row"><span className="info-label">Email</span><span className="info-value">{selectedTransfer.newCaptainEmail}</span></div>
                                </div>
                            </div>
                            <div className="documents-section">
                                <h3><FileText size={18} /> Transfer Documents</h3>
                                <div className="documents-grid">
                                    <DocumentPreview title="Proof of Election (by Old)" url={selectedTransfer.proofDocumentUrl} onImageClick={(url, title) => setModalImage({ url, title })} />
                                    <DocumentPreview title="Cert of Proclamation" url={selectedTransfer.certificateOfProclamationUrl} onImageClick={(url, title) => setModalImage({ url, title })} />
                                    <DocumentPreview title="Government ID" url={selectedTransfer.governmentIdUrl} onImageClick={(url, title) => setModalImage({ url, title })} />
                                    {selectedTransfer.supportingDocumentUrl && (
                                        <DocumentPreview title="Supporting Document" url={selectedTransfer.supportingDocumentUrl} onImageClick={(url, title) => setModalImage({ url, title })} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="action-btn btn-reject" onClick={() => setShowRejectPrompt(true)} disabled={actionLoading}>
                                <XCircle size={16} /> Reject
                            </button>
                            <button className="action-btn btn-approve" onClick={() => handleApprove(selectedTransfer.id)} disabled={actionLoading}>
                                <CheckCircle size={16} /> Approve Transfer
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {showRejectPrompt && (
                <div className="prompt-modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="prompt-modal">
                        <h3>Reason for Transfer Rejection</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explain why this transfer is rejected..."
                            autoFocus
                        />
                        <div className="prompt-actions">
                            <button className="action-btn" onClick={() => setShowRejectPrompt(false)}>Cancel</button>
                            <button
                                className="action-btn btn-approve"
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || actionLoading}
                                style={{ background: 'var(--red-600)' }}
                            >
                                Submit Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalImage && (
                <ImageModal
                    url={modalImage.url}
                    title={modalImage.title}
                    onClose={() => setModalImage(null)}
                />
            )}
        </div>
    );
}
