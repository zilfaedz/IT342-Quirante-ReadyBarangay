import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, AlertTriangle, FileText, Users, Megaphone,
    User, Lock, Siren, Crown, Coins, Package, BarChart3, Bell,
    Plus, Search, X, Check, Trash2, Edit2, Building2
} from "lucide-react";
import "./DashboardCaptain.css";
import "./DashboardOfficial.css";
import "../global.css";
import TransferOwnershipModal from "../components/TransferOwnershipModal";
import AlertModal from "../components/AlertModal";
import IncidentDetailModal from "../components/IncidentDetailModal";
import ManageEvacuationCenters from "../components/ManageEvacuationCenters";
import { getReports, getUsers, updateUserRole, transferCaptain, assignResponder, updateProfile } from "../services/api";
import { useEffect } from "react";

// ---- ICONS (using Lucide) ----
// Replacing the custom Icon helper with direct Lucide components for consistency

// Navigation is handled by the global Sidebar via URL tab query params.

// ---- SCREEN: COMMAND OVERVIEW ----
const CommandOverview = ({ incidents }) => {
    const unresolved = incidents.filter(i => i.status !== "RESOLVED").length;
    const criticalCount = incidents.filter(i => i.urgency === "Critical" || i.urgency === "High").length;

    return (
        <div className="captain-overview">
            <div className="rb-stat-grid">
                <div className="rb-stat-card gold">
                    <div className="rb-stat-icon gold"><Crown size={24} /></div>
                    <div className="rb-stat-label">Barangay Status</div>
                    <div className="rb-stat-value">E-STATE</div>
                    <div className="rb-stat-sub">Emergency Mode Active</div>
                </div>
                <div className="rb-stat-card">
                    <div className="rb-stat-icon red"><Siren size={24} /></div>
                    <div className="rb-stat-label">Total Unresolved</div>
                    <div className="rb-stat-value">{unresolved}</div>
                    <div className="rb-stat-sub">{criticalCount} critical needs priority</div>
                </div>
                <div className="rb-stat-card green">
                    <div className="rb-stat-icon green"><Coins size={24} /></div>
                    <div className="rb-stat-label">Relief Funds</div>
                    <div className="rb-stat-value">₱450k</div>
                    <div className="rb-stat-sub">72% of disaster budget</div>
                </div>
                <div className="rb-stat-card blue">
                    <div className="rb-stat-icon blue"><Package size={24} /></div>
                    <div className="rb-stat-label">Resource Level</div>
                    <div className="rb-stat-value">Good</div>
                    <div className="rb-stat-sub">Stocks for approx. 5 days</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div>
                    <div className="rb-section-header">
                        <div className="rb-section-title">Critical Approvals Required</div>
                        <span className="rb-badge emergency">6 Pending</span>
                    </div>
                    <div className="rb-card">
                        <div className="rb-card-body" style={{ padding: 0 }}>
                            {[
                                { title: "Zone 4 Flood Relief Distribution", requester: "Officer Garcia", type: "Budget", cost: "₱12,500" },
                                { title: "Mass Evacuation Deployment (Zone 1)", requester: "Dispatcher Santos", type: "Operation", cost: "—" },
                                { title: "Emergency Medical Supply Replenishment", requester: "Official Reyes", type: "Purchase", cost: "₱5,400" },
                            ].map((a, i) => (
                                <div key={i} className="approval-item">
                                    <div className="app-info">
                                        <div className="app-title">{a.title}</div>
                                        <div className="app-meta">Requested by: <strong>{a.requester}</strong> · Type: {a.type} {a.cost !== "—" && `· Cost: ${a.cost}`}</div>
                                    </div>
                                    <div className="app-actions">
                                        <button className="rb-btn rb-btn-ghost rb-btn-sm" style={{ color: "var(--red-600)" }}>Decline</button>
                                        <button className="rb-btn rb-btn-primary rb-btn-sm" style={{ background: "var(--green-600)" }}>Approve</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="rb-card-footer" style={{ padding: 12, textAlign: "center", borderTop: "1px solid var(--gray-100)" }}>
                            <button className="rb-btn rb-btn-ghost rb-btn-sm">View All Pending Approvals</button>
                        </div>
                    </div>

                    <div className="rb-section-title" style={{ marginTop: 24, marginBottom: 16 }}>Response Team Efficiency</div>
                    <div className="rb-card">
                        <div className="rb-card-body">
                            <div className="rb-chart-placeholder">Response Time Statistics Chart</div>
                        </div>
                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="rb-card" style={{ marginBottom: 20 }}>
                        <div className="rb-card-header"><div className="rb-card-title">Captain's Broadcast</div></div>
                        <div className="rb-card-body">
                            <textarea className="rb-textarea" placeholder="Broadcast message to all residents..."></textarea>
                            <div className="rb-divider"></div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <Siren size={14} style={{ marginRight: 8 }} />
                                <span style={{ fontSize: 11, fontWeight: 600 }}>High Priority Alert</span>
                                <input type="checkbox" className="rb-toggle-input" style={{ marginLeft: "auto" }} />
                            </div>
                            <button className="rb-btn rb-btn-primary" style={{ width: "100%" }}><Megaphone size={16} style={{ marginRight: 8 }} /> Send Broadcast</button>
                        </div>
                    </div>

                    <div className="rb-card">
                        <div className="rb-card-header"><div className="rb-card-title">Council Activity</div></div>
                        <div className="rb-card-body" style={{ padding: "10px 0" }}>
                            {[
                                { name: "Official Santos", action: "Updated Resources", time: "10m ago" },
                                { name: "Officer Garcia", action: "Resolved INC-042", time: "22m ago" },
                                { name: "Official Reyes", action: "Posted Announcement", time: "1h ago" },
                            ].map((l, i) => (
                                <div key={i} className="mini-log-item">
                                    <div className="rb-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{l.name[0]}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12 }}><strong>{l.name}</strong> {l.action}</div>
                                        <div style={{ fontSize: 10, color: "var(--gray-400)" }}>{l.time}</div>
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

// ---- SCREEN: PERSONNEL MANAGEMENT ----
const PersonnelManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setUsers(res.data);
            setError(null);
        } catch (err) {
            console.error("Fetch users error:", err);
            setError("Failed to load user directory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error("Role update error:", err);
            alert("Failed to update user role.");
        }
    };

    if (loading) return <div className="rb-loading">Loading personnel directory...</div>;
    if (error) return <div className="rb-error">{error}</div>;

    const getRole = (r) => (r || "").toUpperCase();
    const officials = users.filter(u => getRole(u.role) === "OFFICIAL" || getRole(u.role) === "CAPTAIN" || getRole(u.role) === "BARANGAY CAPTAIN");
    const responders = users.filter(u => getRole(u.role) === "RESPONDER");
    const residents = users.filter(u => getRole(u.role) === "RESIDENT");

    const UserTable = ({ title, data, badgeClass }) => (
        <div className="rb-card" style={{ marginBottom: 24 }}>
            <div className="rb-card-header">
                <div className="rb-card-title">{title}</div>
                <span className={`rb-badge ${badgeClass}`}>{data.length} Members</span>
            </div>
            <div className="rb-card-body" style={{ padding: 0 }}>
                {data.length === 0 ? (
                    <div className="rb-empty-small" style={{ padding: "20px", color: "var(--gray-500)" }}>No members in this category.</div>
                ) : (
                    <table className="rb-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div className="rb-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                                {u.firstName?.[0] || u.fullName?.[0] || u.email[0]}
                                            </div>
                                            <strong>{u.firstName ? `${u.firstName} ${u.lastName}` : (u.fullName || "Resident")}</strong>
                                            {(getRole(u.role) === 'CAPTAIN' || getRole(u.role) === 'BARANGAY CAPTAIN') && <span className="rb-badge warn" style={{ fontSize: 9, padding: "2px 4px" }}>CAPTAIN</span>}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{u.email}</td>
                                    <td>
                                        <span className={`rb-status-pill active`}>
                                            Active
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <select
                                            className="rb-select-sm"
                                            value={u.role}
                                            disabled={getRole(u.role) === 'CAPTAIN' || getRole(u.role) === 'BARANGAY CAPTAIN'}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        >
                                            <option value="RESIDENT">Resident</option>
                                            <option value="OFFICIAL">Official</option>
                                            <option value="RESPONDER">Responder</option>
                                            <option value="Barangay Captain" disabled>Captain</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    return (
        <div className="captain-personnel">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Personnel & Residents Directory</div>
                    <div className="rb-section-sub">Manage roles and permissions for all barangay members</div>
                </div>
                <div className="rb-header-actions">
                    <button className="rb-btn rb-btn-ghost">
                        <Search size={16} style={{ marginRight: 6 }} /> Search
                    </button>
                    <button className="rb-btn rb-btn-primary">
                        <Plus size={16} style={{ marginRight: 6 }} /> Add Personnel
                    </button>
                </div>
            </div>

            <UserTable title="Barangay Administration" data={officials} badgeClass="warn" />
            <UserTable title="Emergency Responders" data={responders} badgeClass="emergency" />
            <UserTable title="Registered Residents" data={residents} badgeClass="info" />
        </div>
    );
};

// ---- SCREEN: PROFILE / HANDOVER ----
const CaptainProfile = ({ user }) => {
    const [visibility, setVisibility] = useState(user?.profileVisibility || "OFFICIALS");
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState([]);
    const [targetUserId, setTargetUserId] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);

    const handleSaveVisibility = async () => {
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

    useEffect(() => {
        getUsers()
            .then(res => setUsers(res.data.filter(u => u.id !== user.id)))
            .catch(err => console.error("Fetch users error:", err));
    }, [user.id]);

    const handleTransferClick = () => {
        // Just show the modal. The modal itself now handles the form data.
        setShowConfirmModal(true);
    };

    return (
        <div className="captain-profile">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Captain's Profile & Settings</div>
                    <div className="rb-section-sub">Manage your executive account</div>
                </div>
            </div>

            <div className="rb-card" style={{ maxWidth: 600, marginBottom: 24 }}>
                <div className="rb-card-header"><div className="rb-card-title">Privacy & Visibility</div></div>
                <div className="rb-card-body">
                    <div style={{ marginBottom: 16 }}>
                        <label className="rb-label">Directory Visibility</label>
                        <select
                            className="rb-input"
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                        >
                            <option value="PRIVATE">Private (Only me)</option>
                            <option value="OFFICIALS">Officials Only (Searchable by other Officials)</option>
                            <option value="RESIDENTS">All Residents (Searchable by everyone)</option>
                        </select>
                        <p style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 8 }}>
                            Controls who can see your profile in the Community Directory.
                        </p>
                    </div>
                    <button
                        className="rb-btn rb-btn-primary"
                        onClick={handleSaveVisibility}
                        disabled={saving}
                        style={{ width: "100%" }}
                    >
                        {saving ? "Saving..." : "Save Visibility Settings"}
                    </button>
                </div>
            </div>

            <div className="rb-card" style={{ maxWidth: 600, border: "1px solid var(--red-200)" }}>
                <div className="rb-card-header" style={{ background: "var(--red-50)", borderBottom: "1px solid var(--red-100)" }}>
                    <div className="rb-card-title" style={{ color: "var(--red-700)", display: "flex", alignItems: "center" }}>
                        <AlertTriangle size={18} style={{ marginRight: 8 }} />
                        Danger Zone: Transfer Ownership
                    </div>
                </div>
                <div className="rb-card-body">
                    <p style={{ fontSize: 13, marginBottom: 15, color: "var(--gray-700)" }}>
                        Click below to initiate the transfer process. You will need to provide the new Captain's details and upload proof of election.
                        <strong> You will lose all captain privileges once an Admin approves the transfer.</strong>
                    </p>
                    <button
                        className="rb-btn rb-btn-primary"
                        onClick={handleTransferClick}
                        disabled={saving}
                        style={{ background: "var(--red-600)", border: "none" }}
                    >
                        Initiate Captain Ownership Transfer
                    </button>
                </div>
            </div>

            <TransferOwnershipModal
                show={showConfirmModal}
                onClose={(success) => {
                    setShowConfirmModal(false);
                    if (success === true) {
                        // Optional: You can trigger a UI refresh or wait for admin approval
                    }
                }}
            />

            <AlertModal
                show={showAlertModal}
                title="Selection Required"
                message="Please select a verified barangay member from the dropdown list before attempting to transfer ownership."
                onClose={() => setShowAlertModal(false)}
            />
        </div>
    );
};

// ---- SCREEN: INCIDENT MANAGEMENT ----
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
        <div className="captain-incidents">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">All Incidents</div>
                    <div className="rb-section-sub">View and dispatch emergency reports</div>
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

// ---- MAIN EXPORT ----
export default function DashboardCaptain({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const active = new URLSearchParams(location.search).get("tab") || "overview";
    const [incidents, setIncidents] = useState([]);

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
        const interval = setInterval(fetchIncidents, 30000); // 30s polling
        return () => clearInterval(interval);
    }, []);

    const screens = {
        overview: <CommandOverview incidents={incidents} />,
        incidents: <IncidentManagement incidents={incidents} onRefresh={fetchIncidents} />,
        evacuation: <ManageEvacuationCenters />,
        resources: <div className="rb-empty"><div className="rb-empty-icon"><FileText size={48} /></div><div className="rb-empty-text">Budget & Resource Tracking Module</div></div>,
        personnel: <PersonnelManagement />,
        announcements: <div className="rb-empty"><div className="rb-empty-icon"><Megaphone size={48} /></div><div className="rb-empty-text">Executive Announcement Panel</div></div>,
        profile: <CaptainProfile user={user} />,
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
                <div className="rb-header-title">Executive Command Center</div>
                <div className="rb-header-actions">
                    <span className="captain-badge">COMMAND ACTIVE</span>
                    <div className="rb-notif-bell">
                        <Bell size={20} />
                        <div className="rb-notif-count">{incidents.filter(i => i.status === 'PENDING').length}</div>
                    </div>
                </div>
            </header>

            <div className="rb-content">
                {screens[active] || screens.overview}
            </div>
        </div>
    );
}
