import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import './AlertBanner.css';

const AlertBanner = ({ message, onClose, type = 'error' }) => {
    if (!message) return null;

    return (
        <div className={`alert-banner-container ${type}`}>
            <div className="alert-banner-content">
                <div className="alert-banner-icon">
                    <AlertCircle size={20} />
                </div>
                <div className="alert-banner-text">{message}</div>
                {onClose && (
                    <button className="alert-banner-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default AlertBanner;
