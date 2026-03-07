import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, AlertTriangle, MapPin, Megaphone,
    MessageSquare, User, Lock, CheckCircle2, Activity,
    Users, Siren, ClipboardList, Clock, Send, Bell, Navigation
} from "lucide-react";
import "./DashboardResponder.css";
import "../global.css";
import { getReports } from "../services/api";
import { useEffect } from "react";

// ---- ICONS (using Lucide) ----
// Replacing the custom Icon helper with direct Lucide components for consistency

// Navigation is handled by the global Sidebar via URL tab query params.

// ---- SCREENS ----
const MissionControl = ({ incidents }) => {
    const activeCount = incidents.filter(i => i.status !== "RESOLVED").length;
    const currentMission = incidents.find(i => i.status === "RESPONDING") || incidents[0]; // Just pick the first as "current" for now

    return (
        <div className="responder-missions">
            <div className="rb-stat-grid" style={{ marginBottom: 20 }}>
                <div className="rb-stat-card">
                    <div className="rb-stat-icon green"><CheckCircle2 size={24} /></div>
                    <div className="rb-stat-label">Tasks Completed</div>
                    <div className="rb-stat-value">14</div>
                    <div className="rb-stat-sub">Current Shift: 3</div>
                </div>
                <div className="rb-stat-card amber">
                    <div className="rb-stat-icon amber"><Activity size={24} /></div>
                    <div className="rb-stat-label">Active Missions</div>
                    <div className="rb-stat-value">{activeCount}</div>
                    <div className="rb-stat-sub">Recent dispatches</div>
                </div>
                <div className="rb-stat-card blue">
                    <div className="rb-stat-icon blue"><Users size={24} /></div>
                    <div className="rb-stat-label">My Team</div>
                    <div className="rb-stat-value">Beta</div>
                    <div className="rb-stat-sub">4 active members</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div>
                    <div className="rb-section-header">
                        <div className="rb-section-title">Current Assignment</div>
                        <span className="rb-badge responding">In Progress</span>
                    </div>
                    <div className="rb-card mission-banner">
                        {currentMission ? (
                            <>
                                <div className="mission-header">
                                    <div className="mission-type"><Siren size={20} style={{ marginRight: 8, display: "inline" }} /> {currentMission.incidentType}</div>
                                    <div className="mission-id">ID: INC-{currentMission.id}</div>
                                </div>
                                <div className="rb-card-body">
                                    <div className="mission-details">
                                        <div className="det-item"><span><MapPin size={14} style={{ marginRight: 6 }} /> Location:</span> {currentMission.location}</div>
                                        <div className="det-item"><span><User size={14} style={{ marginRight: 6 }} /> Resident:</span> {currentMission.user?.firstName} ({currentMission.user?.phoneNumber || 'No phone'})</div>
                                        <div className="det-item"><span><ClipboardList size={14} style={{ marginRight: 6 }} /> Situation:</span> {currentMission.description}</div>
                                        <div className="det-item"><span><Clock size={14} style={{ marginRight: 6 }} /> Reported:</span> {new Date(currentMission.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                    <div className="rb-divider"></div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button className="rb-btn rb-btn-primary" style={{ flex: 1 }}><MapPin size={16} style={{ marginRight: 6 }} /> Open in Maps</button>
                                        <button className="rb-btn rb-btn-secondary" style={{ flex: 1 }}><Navigation size={16} style={{ marginRight: 6 }} /> Contact Resident</button>
                                    </div>
                                    <button className="rb-btn rb-btn-primary rb-btn-lg" style={{ width: "100%", marginTop: 12, background: "var(--green-600)" }}><CheckCircle2 size={20} style={{ marginRight: 8 }} /> Mark as Resolved</button>
                                </div>
                            </>
                        ) : (
                            <div className="rb-card-body" style={{ textAlign: "center", padding: 40 }}>
                                <CheckCircle2 size={48} color="var(--green-600)" style={{ marginBottom: 16 }} />
                                <div>No current assignments.</div>
                            </div>
                        )}
                    </div>

                    <div className="rb-section-title" style={{ marginTop: 24, marginBottom: 16 }}>Queued Missions</div>
                    <div className="rb-card">
                        <div className="rb-table-wrap">
                            <table className="rb-table">
                                <thead><tr><th>Type</th><th>Location</th><th>Priority</th><th>Time</th><th>Action</th></tr></thead>
                                <tbody>
                                    {incidents.filter(i => i.status === "PENDING").map(i => (
                                        <tr key={i.id}>
                                            <td>{i.incidentType}</td>
                                            <td>{i.location}</td>
                                            <td><span className={`rb-badge ${i.urgency?.toLowerCase() || 'medium'}`}>{i.urgency || 'Med'}</span></td>
                                            <td>{new Date(i.createdAt).toLocaleTimeString()}</td>
                                            <td><button className="rb-btn rb-btn-secondary rb-btn-sm">Accept</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="rb-card" style={{ marginBottom: 20 }}>
                        <div className="rb-card-header"><div className="rb-card-title">Responder Status</div></div>
                        <div className="rb-card-body">
                            <div className="responder-status-grid">
                                <button className="status-opt active green">On Duty</button>
                                <button className="status-opt amber">On Break</button>
                                <button className="status-opt">Off Duty</button>
                            </div>
                            <div className="rb-divider"></div>
                            <div className="status-toggle-item">
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>Share Live Location</div>
                                    <div style={{ fontSize: 10, color: "var(--gray-400)" }}>HQ and Dispatch only</div>
                                </div>
                                <input type="checkbox" className="rb-toggle-input" defaultChecked />
                            </div>
                        </div>
                    </div>

                    <div className="rb-card">
                        <div className="rb-card-header"><div className="rb-card-title">Dispatch Channel</div></div>
                        <div className="rb-card-body chat-mini">
                            <div className="chat-bubble dispatcher"><strong>Dispatch:</strong> Team Beta, proceed to Zone 1 after current op.</div>
                            <div className="chat-bubble me"><strong>Me:</strong> Copy that. Estimating 10 mins to resolution here.</div>
                            <div className="chat-bubble dispatcher"><strong>Dispatch:</strong> Roger. Assistance requested at Z-4?</div>
                            <div className="chat-bubble me"><strong>Me:</strong> Negative. We have it under control.</div>
                        </div>
                        <div className="chat-input-wrap">
                            <input placeholder="Type message..." />
                            <button><Send size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function DashboardResponder({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const active = new URLSearchParams(location.search).get("tab") || "missions";
    const [incidents, setIncidents] = useState([]);

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const res = await getReports();
                setIncidents(res.data);
            } catch (err) {
                console.error("Fetch incidents error:", err);
            }
        };
        fetchIncidents();
        const interval = setInterval(fetchIncidents, 30000); // 30s polling
        return () => clearInterval(interval);
    }, []);

    const screens = {
        missions: <MissionControl incidents={incidents} />,
        incidents: <div className="rb-card">
            <div className="rb-table-wrap">
                <table className="rb-table">
                    <thead><tr><th>ID</th><th>Type</th><th>Priority</th><th>Resident</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>
                        {incidents.map(i => (
                            <tr key={i.id}>
                                <td><code>INC-{i.id}</code></td>
                                <td>{i.incidentType}</td>
                                <td><span className={`rb-badge ${i.urgency?.toLowerCase() || 'medium'}`}>{i.urgency || 'Medium'}</span></td>
                                <td>{i.user?.firstName} {i.user?.lastName}</td>
                                <td>{new Date(i.createdAt).toLocaleTimeString()}</td>
                                <td><span className={`rb-badge ${i.status.toLowerCase()}`}>{i.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>,
        map: <div className="rb-empty"><div className="rb-empty-icon"><MapPin size={48} /></div><div className="rb-empty-text">Field Operations Map</div></div>,
        announcements: <div className="rb-empty"><div className="rb-empty-icon"><Megaphone size={48} /></div><div className="rb-empty-text">Responder Advisories</div></div>,
        chat: <div className="rb-empty"><div className="rb-empty-icon"><MessageSquare size={48} /></div><div className="rb-empty-text">Team Live Communication</div></div>,
        profile: <div className="rb-empty"><div className="rb-empty-icon"><User size={48} /></div><div className="rb-empty-text">Responder Settings</div></div>,
    };

    const titles = {
        missions: "Mission Control",
        incidents: "Incident Tasks",
        map: "Response Map",
        announcements: "Dispatches & Alerts",
        chat: "Team Comms",
        profile: "Field Profile",
    };

    useEffect(() => {
        const validTabs = new Set(Object.keys(screens));
        if (!validTabs.has(active)) {
            navigate("/dashboard?tab=missions", { replace: true });
        }
    }, [active, navigate]);

    return (
        <div className="dashboard-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="rb-header" style={{ marginBottom: '20px', borderRadius: '12px' }}>
                <div className="rb-header-title">{titles[active]}</div>
                <div className="rb-header-actions">
                    <span className="responder-badge">ON DUTY</span>
                    <div className="rb-notif-bell">
                        <Bell size={20} />
                        <div className="rb-notif-count">2</div>
                    </div>
                </div>
            </header>

            <div className="rb-content">
                {screens[active] || screens.missions}
            </div>
        </div>
    );
}
