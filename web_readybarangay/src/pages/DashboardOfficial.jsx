import { useState } from "react";
import {
    Megaphone, Package, ClipboardList, Siren, Activity,
    Building2, Home, MapPin, Bell
} from "lucide-react";
import "./DashboardOfficial.css";
import "../global.css";
import LogoutModal from "../components/LogoutModal";
import IncidentDetailModal from "../components/IncidentDetailModal";
import ManageEvacuationCenters from "../components/ManageEvacuationCenters";
import { getReports, getUsers, assignResponder, getCommunityDirectory, updateProfile } from "../services/api";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ---- ICONS (using Lucide) ----
// Replacing the custom Icon helper with direct Lucide components for consistency

// Navigation is handled by the global Sidebar via URL tab query params.

// ---- SCREENS ----
const Overview = ({ incidents }) => {
    const activeIncidents = incidents.filter(i => i.status !== "RESOLVED" && i.status !== "RESOLVED"); // Backend uses PENDING, RESOLVED?
    // Let's assume PENDING and others are active.
    const pendingCount = incidents.filter(i => i.status === "PENDING").length;

    return (
        <div className="official-overview">
            <div className="rb-stat-grid">
                <div className="rb-stat-card">
                    <div className="rb-stat-icon red"><Siren size={24} /></div>
                    <div className="rb-stat-label">Active Incidents</div>
                    <div className="rb-stat-value">{incidents.filter(i => i.status !== "RESOLVED").length}</div>
                    <div className="rb-stat-sub">{pendingCount} pending review</div>
                </div>
                <div className="rb-stat-card amber">
                    <div className="rb-stat-icon amber"><Activity size={24} /></div>
                    <div className="rb-stat-label">On-field Responders</div>
                    <div className="rb-stat-value">8 / 15</div>
                    <div className="rb-stat-sub">3 teams active, 2 on standby</div>
                </div>
                <div className="rb-stat-card green">
                    <div className="rb-stat-icon green"><Building2 size={24} /></div>
                    <div className="rb-stat-label">Evacuation Centers</div>
                    <div className="rb-stat-value">3</div>
                    <div className="rb-stat-sub">620 / 1000 total capacity</div>
                </div>
                <div className="rb-stat-card blue">
                    <div className="rb-stat-icon blue"><Home size={24} /></div>
                    <div className="rb-stat-label">Registered Residents</div>
                    <div className="rb-stat-value">2,450</div>
                    <div className="rb-stat-sub">12 new this week</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div className="rb-card">
                    <div className="rb-card-header">
                        <div className="rb-card-title">Live Response Map</div>
                        <div className="rb-filters">
                            <span className="rb-badge responding">Active Items Only</span>
                        </div>
                    </div>
                    <div className="rb-card-body">
                        <div className="rb-map-placeholder" style={{ height: 400 }}><MapPin size={24} style={{ marginRight: 8 }} /> Live Map View</div>
                    </div>
                </div>
                <div className="overview-sidebar">
                    <div className="rb-card" style={{ marginBottom: 20 }}>
                        <div className="rb-card-header"><div className="rb-card-title">Barangay Status</div></div>
                        <div className="rb-card-body">
                            <div className="status-toggle-item">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>Emergency Alert Mode</div>
                                    <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Brgy-wide notification</div>
                                </div>
                                <input type="checkbox" className="rb-toggle-input" />
                            </div>
                            <div className="rb-divider"></div>
                            <div className="status-toggle-item">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>Evacuation Mandatory</div>
                                    <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Active for Zone 1 & 4</div>
                                </div>
                                <input type="checkbox" className="rb-toggle-input" defaultChecked />
                            </div>
                        </div>
                    </div>

                    <div className="rb-card">
                        <div className="rb-card-header"><div className="rb-card-title">Recent Logs</div></div>
                        <div className="rb-card-body" style={{ padding: "10px 0" }}>
                            {incidents.slice(0, 4).map((l, i) => (
                                <div key={i} className="mini-log-item">
                                    <div className={`log-dot ${l.incidentType.toLowerCase()}`}></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>{l.user?.firstName || 'Resident'} reported {l.incidentType}</div>
                                        <div style={{ fontSize: 10, color: "var(--gray-400)" }}>{new Date(l.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IncidentManagement = ({ incidents, onRefresh }) => {
    const [users, setUsers] = useState([]);
    const [assigningId, setAssigningId] = useState(null);
    const [selectedIncident, setSelectedIncident] = useState(null);

    useEffect(() => {
        getUsers()
            .then(res => setUsers(res.data))
            .catch(err => console.error("Fetch users error:", err));
    }, []);

    const responders = users.filter(u => u.role === "RESPONDER");

    const handleAssign = async (reportId, responderId) => {
        setAssigningId(reportId);
        try {
            await assignResponder(reportId, responderId || null);
            onRefresh();
        } catch (err) {
            console.error("Assign error", err);
            alert("Failed to assign responder");
        }
        setAssigningId(null);
    };

    return (
        <div className="official-incidents">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Active Incidents</div>
                    <div className="rb-section-sub">Assign priority teams and manage real-time alerts</div>
                </div>
            </div>

            <div className="rb-card">
                <div className="rb-table-wrap">
                    <table className="rb-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Priority</th>
                                <th>Resident</th>
                                <th>Assigned To</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidents.map(i => (
                                <tr key={i.id}>
                                    <td><code>INC-{i.id}</code></td>
                                    <td>{i.incidentType}</td>
                                    <td><span className={`rb-badge ${i.urgency?.toLowerCase() || 'medium'}`}>{i.urgency || 'Medium'}</span></td>
                                    <td>{i.user?.firstName} {i.user?.lastName}</td>
                                    <td>
                                        {i.responder ? (
                                            `${i.responder.firstName} ${i.responder.lastName}`
                                        ) : (
                                            <span style={{ color: "var(--gray-400)", fontStyle: "italic" }}>Unassigned</span>
                                        )}
                                    </td>
                                    <td>{new Date(i.createdAt).toLocaleTimeString()}</td>
                                    <td><span className={`rb-badge ${i.status.toLowerCase()}`}>{i.status}</span></td>
                                    <td style={{ textAlign: "right" }}>
                                        <button className="rb-btn rb-btn-secondary rb-btn-sm" onClick={() => setSelectedIncident(i)}>Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedIncident && (
                <IncidentDetailModal
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    onRefresh={onRefresh}
                />
            )}
        </div>
    );
};

const ResidentDirectory = () => {
    const [directory, setDirectory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        getCommunityDirectory()
            .then(res => setDirectory(res.data))
            .catch(err => console.error("Fetch directory error:", err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = directory.filter(r =>
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.purok.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="rb-section-header">
                <div className="rb-section-title">Community Directory</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                    Showing residents who have opted to be visible.
                </div>
            </div>
            <div className="rb-filters">
                <input
                    className="rb-search-input"
                    style={{ width: 400 }}
                    placeholder="Search by Name or Purok..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="rb-card">
                <div className="rb-table-wrap">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>Loading directory...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>No residents found.</div>
                    ) : (
                        <table className="rb-table">
                            <thead>
                                <tr>
                                    <th>Profile</th>
                                    <th>Name</th>
                                    <th>Purok</th>
                                    <th>Role</th>
                                    <th>Verified</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => (
                                    <tr key={i}>
                                        <td><div className="rb-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{r.fullName[0]}</div></td>
                                        <td><div style={{ fontWeight: 600 }}>{r.fullName}</div></td>
                                        <td>{r.purok || "—"}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{r.role.toLowerCase()}</td>
                                        <td>
                                            {r.verified ?
                                                <span className="rb-badge green" style={{ fontSize: 10 }}>Verified</span> :
                                                <span className="rb-badge pending" style={{ fontSize: 10 }}>Unverified</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const OfficialProfile = ({ user }) => {
    const [visibility, setVisibility] = useState(user?.profileVisibility || "OFFICIALS");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({ ...user, profileVisibility: visibility });
            alert("Profile visibility updated!");
        } catch (err) {
            console.error(err);
            alert("Failed to update visibility.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: 600 }}>
            <div className="rb-section-title">Official Profile Settings</div>
            <div className="rb-card">
                <div className="rb-card-header"><div className="rb-card-title">Privacy & Visibility</div></div>
                <div className="rb-card-body">
                    <div style={{ marginBottom: 16 }}>
                        <label className="rb-label">Directory Visibility</label>
                        <select
                            className="rb-input"
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                        >
                            <option value="PRIVATE">Private (Searchable by no one)</option>
                            <option value="OFFICIALS">Officials Only (Searchable by other Officials)</option>
                            <option value="RESIDENTS">All Residents (Searchable by everyone)</option>
                        </select>
                        <p style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 8 }}>
                            As an official, "Officials Only" is often recommended so residents can find you if needed,
                            but you can set it to Private if you wish to remain hidden from the community directory.
                        </p>
                    </div>
                    <button
                        className="rb-btn rb-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                        style={{ width: "100%" }}
                    >
                        {saving ? "Saving..." : "Save Visibility Settings"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ---- MAIN EXPORT ----
export default function DashboardOfficial({ user }) {
    const [showLogout, setShowLogout] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    const active = new URLSearchParams(location.search).get("tab") || "overview";

    const fetchIncidents = async () => {
        try {
            const res = await getReports();
            setIncidents(res.data);
        } catch (err) {
            console.error("Fetch incidents error:", err);
        }
    };

    useEffect(() => {
        fetchIncidents();
        const interval = setInterval(fetchIncidents, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
    };

    const screens = {
        overview: <Overview incidents={incidents} />,
        incidents: <IncidentManagement incidents={incidents} onRefresh={fetchIncidents} />,
        evacuation: <ManageEvacuationCenters />,
        directory: <ResidentDirectory />,
        announcements: <div className="rb-empty"><div className="rb-empty-icon"><Megaphone size={48} /></div><div className="rb-empty-text">Announcement Creation Panel</div></div>,
        resources: <div className="rb-empty"><div className="rb-empty-icon"><Package size={48} /></div><div className="rb-empty-text">Inventory & Resource Module</div></div>,
        logs: <div className="rb-empty"><div className="rb-empty-icon"><ClipboardList size={48} /></div><div className="rb-empty-text">System Performance & Logs</div></div>,
        profile: <OfficialProfile user={user} />,
    };

    const titles = {
        overview: "Command Center Overview",
        incidents: "Incident Management",
        evacuation: "Evacuation Centers",
        directory: "Resident Directory",
        announcements: "Manage Announcements",
        resources: "Resource Inventory",
        logs: "Audit Logs",
        profile: "My Settings",
    };

    useEffect(() => {
        const validTabs = new Set(Object.keys(screens));
        if (!validTabs.has(active)) {
            navigate("/dashboard?tab=overview", { replace: true });
        }
    }, [active, navigate]);

    return (
        <div className="dashboard-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="rb-header" style={{ marginBottom: '20px', borderRadius: '12px' }}>
                <div className="rb-header-title">{titles[active]}</div>
                <div className="rb-header-actions">
                    <div className="rb-notif-bell">
                        <Bell size={20} />
                        <div className="rb-notif-count">5</div>
                    </div>
                </div>
            </header>

            <div className="rb-content">
                {screens[active] || screens.overview}
            </div>

            <LogoutModal
                show={showLogout}
                onClose={() => setShowLogout(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
}
