import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyTransfer } from '../services/api';
import { CheckCircle, AlertTriangle, ShieldCheck, UploadCloud } from 'lucide-react';

export default function TransferVerificationPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [certFile, setCertFile] = useState(null);
    const [idFile, setIdFile] = useState(null);
    const [suppFile, setSuppFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!certFile || !idFile) {
            setError("Both Certificate of Proclamation and Government ID are required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("token", token);
            formData.append("certificateOfProclamation", certFile);
            formData.append("governmentId", idFile);
            if (suppFile) {
                formData.append("supportingDocument", suppFile);
            }

            await verifyTransfer(formData);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--green-100)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={48} />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: 'var(--gray-900)' }}>Documents Received</h2>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '30px', lineHeight: '1.6' }}>
                        Your documents have been successfully submitted and are now pending verification by the system administrator.
                        You will be notified once your Captain account is approved.
                    </p>
                    <button className="auth-btn-primary" onClick={() => navigate('/login')}>
                        Go to Login
                    </button>
                    <p style={{ marginTop: '15px', fontSize: '12px', color: 'var(--gray-500)' }}>
                        If you don't have a ReadyBarangay account yet, please register first.
                        <br />
                        <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: 'var(--red-600)', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>Register Here</button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container" style={{ background: '#f9fafb' }}>
            <div className="auth-card" style={{ maxWidth: '600px', width: '100%', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--red-50)', borderRadius: '12px', color: 'var(--red-600)', marginBottom: '16px' }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '8px' }}>Captain Verification</h1>
                    <p style={{ color: 'var(--gray-600)' }}>Please upload your official documents to verify your administrative transfer.</p>
                </div>

                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--red-50)', color: 'var(--red-700)', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                        <AlertTriangle size={20} />
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group" style={{ marginBottom: '20px' }}>
                        <label className="auth-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UploadCloud size={16} /> Certificate of Proclamation <span style={{ color: 'var(--red-500)' }}>*</span>
                        </label>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '-8px', marginBottom: '8px' }}>Official document declaring you as the winner of the barangay election.</p>
                        <input
                            type="file"
                            className="auth-input"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => setCertFile(e.target.files[0])}
                            style={{ padding: '8px', fontSize: '14px' }}
                        />
                    </div>

                    <div className="auth-form-group" style={{ marginBottom: '20px' }}>
                        <label className="auth-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UploadCloud size={16} /> Government-issued ID <span style={{ color: 'var(--red-500)' }}>*</span>
                        </label>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '-8px', marginBottom: '8px' }}>Valid ID matching the name on the Certificate of Proclamation.</p>
                        <input
                            type="file"
                            className="auth-input"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => setIdFile(e.target.files[0])}
                            style={{ padding: '8px', fontSize: '14px' }}
                        />
                    </div>

                    <div className="auth-form-group" style={{ marginBottom: '30px' }}>
                        <label className="auth-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UploadCloud size={16} /> Supporting Document (Optional)
                        </label>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '-8px', marginBottom: '8px' }}>Any additional proof to expedite the verification process.</p>
                        <input
                            type="file"
                            className="auth-input"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => setSuppFile(e.target.files[0])}
                            style={{ padding: '8px', fontSize: '14px' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold' }}
                    >
                        {loading ? 'Submitting Documents...' : 'Submit for Verification'}
                    </button>

                    <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--gray-500)', textAlign: 'center', lineHeight: '1.5' }}>
                        By submitting these documents, you certify that the information provided is true and correct.
                        Falsification of documents is punishable by law.
                    </p>
                </form>
            </div>
        </div>
    );
}
