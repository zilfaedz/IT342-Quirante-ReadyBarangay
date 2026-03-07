import { X, MapPin, User, AlertTriangle, Shield, Camera, ChevronRight, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { updateReportStatus, assignResponder, getUsers } from "../services/api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issues with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ---- helpers ----
const URGENCY_CONFIG = {
    High: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", bars: 3 },
    Medium: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", bars: 2 },
    Low: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", bars: 1 },
};

const STATUS_CONFIG = {
    Pending: { color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
    Active: { color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
    Responding: { color: "#2563eb", bg: "#eff6ff", dot: "#3b82f6" },
    Resolved: { color: "#16a34a", bg: "#f0fdf4", dot: "#22c55e" },
    Closed: { color: "#6b7280", bg: "#f9fafb", dot: "#9ca3af" },
};

function UrgencyBars({ level }) {
    const cfg = URGENCY_CONFIG[level] || URGENCY_CONFIG.Medium;
    return (
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    width: 20, height: 5, borderRadius: 999,
                    background: i <= cfg.bars ? cfg.color : "#e5e7eb",
                    transition: "background 0.2s",
                }} />
            ))}
        </div>
    );
}

function StatusPill({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 999,
            background: cfg.bg, color: cfg.color,
            fontSize: 11, fontWeight: 800, fontFamily: "var(--font-ui)",
            textTransform: "uppercase", letterSpacing: "0.6px",
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: cfg.dot,
                ...(status === "Active" || status === "Responding" ? {
                    boxShadow: `0 0 0 3px ${cfg.dot}33`,
                    animation: "statusPulse 1.8s infinite",
                } : {}),
            }} />
            {status}
        </span>
    );
}

function UrgencyPill({ urgency }) {
    const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.Medium;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "4px 10px", borderRadius: 999,
            background: cfg.bg, color: cfg.color,
            border: `1.5px solid ${cfg.border}`,
            fontSize: 11, fontWeight: 800, fontFamily: "var(--font-ui)",
            textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
            {urgency}
            <UrgencyBars level={urgency} />
        </span>
    );
}

const FIELD_ICON = { color: "var(--gray-400)", flexShrink: 0 };

function DetailRow({ icon, label, children }) {
    return (
        <div style={{
            display: "flex", gap: 12, padding: "14px 0",
            borderBottom: "1px solid var(--gray-100)",
            alignItems: "flex-start",
        }}>
            <div style={{ ...FIELD_ICON, marginTop: 1 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.7px", color: "var(--gray-400)",
                    fontFamily: "var(--font-ui)", marginBottom: 4,
                }}>
                    {label}
                </div>
                <div style={{ fontSize: 14, color: "var(--gray-800)", fontFamily: "var(--font-ui)", fontWeight: 500 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// ---- main component ----
export default function IncidentDetailModal({ incident, onClose, onRefresh }) {
    const [isManaging, setIsManaging] = useState(false);
    const [status, setStatus] = useState(incident?.status || "");
    const [responderId, setResponderId] = useState(incident?.responder?.id || "");
    const [responders, setResponders] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isManaging && responders.length === 0) {
            getUsers().then(res => {
                setResponders(res.data.filter(u => u.role === "RESPONDER"));
            }).catch(console.error);
        }
    }, [isManaging, responders.length]);

    const handleSave = async () => {
        if (!incident) return;
        setIsSaving(true);
        try {
            if (status !== incident.status) {
                await updateReportStatus(incident.id, status);
            }
            if (responderId !== (incident.responder?.id || "")) {
                await assignResponder(incident.id, responderId || null);
            }
            if (onRefresh) onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to update incident.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!incident) return null;

    const urgencyCfg = URGENCY_CONFIG[incident.urgency] || URGENCY_CONFIG.Medium;
    const responderName = incident.responder
        ? `${incident.responder.firstName} ${incident.responder.lastName}`
        : null;

    return (
        <>
            {/* keyframes injected inline */}
            <style>{`
                @keyframes incidentModalOverlay {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes incidentModalSlide {
                    from { opacity: 0; transform: scale(0.95) translateY(12px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);    }
                }
                @keyframes statusPulse {
                    0%, 100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }
                    50%      { box-shadow: 0 0 0 7px rgba(239,68,68,0);   }
                }
            `}</style>

            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, zIndex: 1200,
                    background: "rgba(15,23,42,0.55)",
                    backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 20,
                    animation: "incidentModalOverlay 0.2s ease",
                }}
            >
                {/* Modal */}
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: "100%", maxWidth: 520,
                        background: "white",
                        borderRadius: 16,
                        boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                        animation: "incidentModalSlide 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                        maxHeight: "90vh",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Header bar — urgency color accent */}
                    <div style={{
                        height: 4,
                        background: `linear-gradient(90deg, ${urgencyCfg.color}, ${urgencyCfg.color}88)`,
                    }} />

                    {/* Header */}
                    <div style={{
                        padding: "20px 24px 16px",
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                        gap: 16,
                        borderBottom: "1px solid var(--gray-100)",
                    }}>
                        <div>
                            <div style={{
                                fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                                letterSpacing: "0.8px", color: "var(--gray-400)",
                                fontFamily: "var(--font-ui)", marginBottom: 6,
                            }}>
                                Incident Report
                            </div>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                            }}>
                                <span style={{
                                    fontFamily: "var(--font-display)", fontSize: 20,
                                    fontWeight: 900, color: "var(--gray-900)", letterSpacing: "-0.3px",
                                }}>
                                    INC-{incident.id}
                                </span>
                                <StatusPill status={incident.status} />
                            </div>
                            <div style={{
                                fontSize: 13, color: "var(--gray-500)", marginTop: 4,
                                fontFamily: "var(--font-ui)", fontWeight: 600,
                            }}>
                                {incident.incidentType}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: "var(--gray-100)", border: "none",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", flexShrink: 0,
                                transition: "background 0.15s",
                                color: "var(--gray-500)",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--gray-200)"}
                            onMouseLeave={e => e.currentTarget.style.background = "var(--gray-100)"}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body — scrollable */}
                    <div style={{ overflowY: "auto", flex: 1, padding: "4px 24px 0" }}>

                        {/* Key info rows */}
                        <DetailRow icon={<User size={15} />} label="Reported By">
                            {incident.user?.firstName} {incident.user?.lastName}
                        </DetailRow>

                        <DetailRow icon={<MapPin size={15} />} label="Location">
                            <div style={{ marginBottom: incident.latitude ? 12 : 0 }}>
                                {incident.location}
                            </div>
                            {incident.latitude && incident.longitude && (
                                <div style={{ height: 180, borderRadius: 8, overflow: 'hidden', border: "1.5px solid var(--gray-200)" }}>
                                    <MapContainer center={[incident.latitude, incident.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Marker position={[incident.latitude, incident.longitude]} />
                                    </MapContainer>
                                </div>
                            )}
                        </DetailRow>

                        <DetailRow icon={<AlertTriangle size={15} />} label="Priority">
                            <UrgencyPill urgency={incident.urgency} />
                        </DetailRow>

                        {isManaging ? (
                            <>
                                <DetailRow icon={<Shield size={15} />} label="Assigned Responder">
                                    <select
                                        value={responderId}
                                        onChange={(e) => setResponderId(e.target.value)}
                                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--gray-300)", width: "100%", fontFamily: "var(--font-ui)", fontSize: "13px" }}
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {responders.map(r => (
                                            <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                                        ))}
                                    </select>
                                </DetailRow>

                                <DetailRow icon={<AlertTriangle size={15} />} label="Incident Status">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--gray-300)", width: "100%", fontFamily: "var(--font-ui)", fontSize: "13px" }}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="RESPONDING">Responding</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </DetailRow>
                            </>
                        ) : (
                            <DetailRow
                                icon={<Shield size={15} />}
                                label="Assigned Responder"
                            >
                                {responderName ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{
                                            width: 26, height: 26, borderRadius: "50%",
                                            background: "linear-gradient(135deg, var(--red-700), var(--red-500))",
                                            color: "white", fontSize: 11, fontWeight: 800,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontFamily: "var(--font-display)",
                                        }}>
                                            {incident.responder.firstName?.[0]}{incident.responder.lastName?.[0]}
                                        </span>
                                        {responderName}
                                    </span>
                                ) : (
                                    <span style={{ color: "var(--gray-400)", fontStyle: "italic", fontSize: 13 }}>
                                        Unassigned
                                    </span>
                                )}
                            </DetailRow>
                        )}

                        {/* Description */}
                        <div style={{ padding: "16px 0" }}>
                            <div style={{
                                fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                                letterSpacing: "0.7px", color: "var(--gray-400)",
                                fontFamily: "var(--font-ui)", marginBottom: 10,
                            }}>
                                Description
                            </div>
                            <div style={{
                                background: "var(--gray-50)",
                                border: "1.5px solid var(--gray-200)",
                                borderRadius: 10, padding: "14px 16px",
                                fontSize: 13.5, color: "var(--gray-700)",
                                lineHeight: 1.65, fontFamily: "var(--font-ui)",
                            }}>
                                {incident.description || <span style={{ color: "var(--gray-400)", fontStyle: "italic" }}>No description provided.</span>}
                            </div>
                        </div>

                        {/* Photo Evidence */}
                        {incident.photoUrl && (
                            <div style={{ paddingBottom: 20 }}>
                                <div style={{
                                    fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                                    letterSpacing: "0.7px", color: "var(--gray-400)",
                                    fontFamily: "var(--font-ui)", marginBottom: 10,
                                    display: "flex", alignItems: "center", gap: 6,
                                }}>
                                    <Camera size={12} />
                                    Photo Evidence
                                </div>
                                <div style={{
                                    borderRadius: 10, overflow: "hidden",
                                    border: "1.5px solid var(--gray-200)",
                                    position: "relative",
                                }}>
                                    <img
                                        src={`http://localhost:8080${incident.photoUrl}`}
                                        alt="Incident evidence"
                                        style={{ width: "100%", display: "block", maxHeight: 260, objectFit: "cover" }}
                                    />
                                    <div style={{
                                        position: "absolute", bottom: 0, left: 0, right: 0,
                                        background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                                        padding: "20px 12px 10px",
                                        fontSize: 11, color: "rgba(255,255,255,0.85)",
                                        fontFamily: "var(--font-ui)", fontWeight: 600,
                                    }}>
                                        Submitted evidence photo
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: "14px 24px",
                        borderTop: "1px solid var(--gray-100)",
                        display: "flex", justifyContent: "flex-end", gap: 10,
                        background: "var(--gray-50)",
                    }}>
                        {isManaging ? (
                            <>
                                <button
                                    onClick={() => { setIsManaging(false); setStatus(incident.status); setResponderId(incident.responder?.id || ""); }}
                                    style={{
                                        padding: "8px 16px", borderRadius: 8,
                                        border: "1.5px solid var(--gray-200)",
                                        background: "white", color: "var(--gray-600)",
                                        fontSize: 13, fontWeight: 700, fontFamily: "var(--font-ui)",
                                        cursor: "pointer", transition: "all 0.15s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-100)"; e.currentTarget.style.borderColor = "var(--gray-300)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "var(--gray-200)"; }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    style={{
                                        padding: "8px 18px", borderRadius: 8,
                                        border: "none",
                                        background: "linear-gradient(135deg, var(--green-600), var(--green-500))",
                                        color: "white",
                                        fontSize: 13, fontWeight: 800, fontFamily: "var(--font-ui)",
                                        cursor: isSaving ? "not-allowed" : "pointer",
                                        display: "flex", alignItems: "center", gap: 6,
                                        boxShadow: "0 2px 8px rgba(34,197,94,0.3)",
                                        transition: "all 0.15s",
                                        opacity: isSaving ? 0.7 : 1,
                                    }}
                                    onMouseEnter={e => { if (!isSaving) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(34,197,94,0.4)"; } }}
                                    onMouseLeave={e => { if (!isSaving) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(34,197,94,0.3)"; } }}
                                >
                                    {isSaving ? "Saving..." : <><Save size={14} /> Save Changes</>}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    style={{
                                        padding: "8px 16px", borderRadius: 8,
                                        border: "1.5px solid var(--gray-200)",
                                        background: "white", color: "var(--gray-600)",
                                        fontSize: 13, fontWeight: 700, fontFamily: "var(--font-ui)",
                                        cursor: "pointer", transition: "all 0.15s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-100)"; e.currentTarget.style.borderColor = "var(--gray-300)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "var(--gray-200)"; }}
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => setIsManaging(true)}
                                    style={{
                                        padding: "8px 18px", borderRadius: 8,
                                        border: "none",
                                        background: "linear-gradient(135deg, var(--red-700), var(--red-500))",
                                        color: "white",
                                        fontSize: 13, fontWeight: 800, fontFamily: "var(--font-ui)",
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 6,
                                        boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
                                        transition: "all 0.15s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.4)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(220,38,38,0.3)"; }}
                                >
                                    Manage Incident <ChevronRight size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
