import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import "./notification.css";

export default function Notification({ message, type, show, onClose }) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // disappears after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <div className={`notification-wrapper ${show ? "show" : ""}`}>
            <div className={`notification-box ${type}`}>
                <div className="notification-icon">
                    {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <div className="notification-text">{message}</div>
            </div>
        </div>
    );
}
