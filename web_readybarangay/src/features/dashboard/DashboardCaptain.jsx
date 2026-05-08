import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    AlertTriangle, FileText, Megaphone,
    Siren, Crown, Coins, Package, Bell,
    Plus, Search, Wallet, TrendingUp, Truck,
    Archive, ShoppingCart, ClipboardCheck, Minus,
    Camera, MapPin, Mail, Calendar, User, Edit,
    Lock, CheckCircle2, Building2, Send
} from "lucide-react";
import "./DashboardCaptain.css";
import "./DashboardOfficial.css";
import "../profile/Profile.css";
import "../../global.css";
import TransferOwnershipModal from "../transfers/TransferOwnershipModal";
import IncidentDetailModal from "../reports/IncidentDetailModal";
import ManageEvacuationCenters from "../evacuation-centers/ManageEvacuationCenters";
import { useAuth } from "../../shared/auth/AuthContext";
import {
    getReports,
    getUsers,
    updateUserRole,
    updateProfile,
    getResourceDashboard,
    createBudgetLine,
    createResourceItem,
    updateResourceItem,
    createPurchaseRequest,
    updatePurchaseRequest,
    uploadProfilePicture,
    getAnnouncements,
    createAnnouncement
} from "../../shared/api/api";
import { useEffect } from "react";

const VALID_CAPTAIN_TABS = new Set([
    "overview",
    "incidents",
    "evacuation",
    "resources",
    "personnel",
    "announcements",
    "profile",
]);

const EMPTY_RESOURCE_DASHBOARD = {
    budgetLines: [],
    resources: [],
    purchaseRequests: [],
    summary: {
        allocated: 0,
        spent: 0,
        remaining: 0,
        pendingRequestAmount: 0,
        pendingRequestCount: 0,
        lowStockCount: 0,
        readiness: 0,
    },
};

const toNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const formatMoney = (value) => `PHP ${toNumber(value).toLocaleString("en-PH")}`;
const formatStatusLabel = (status) => (status || "Pending").replace(/_/g, " ");
const isPendingRequest = (request) => !["APPROVED", "REJECTED"].includes((request.status || "PENDING").toUpperCase());
const getReportLocation = (report) => report.location || report.address || report.purok || "Location pending";

// ---- ICONS (using Lucide) ----
// Replacing the custom Icon helper with direct Lucide components for consistency

// Navigation is handled by the global Sidebar via URL tab query params.

// ---- SCREEN: COMMAND OVERVIEW ----
const CommandOverview = ({
    incidents,
    resourceSummary = EMPTY_RESOURCE_DASHBOARD.summary,
    resourceData = EMPTY_RESOURCE_DASHBOARD,
    onRefreshResources,
}) => {
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [broadcastHighPriority, setBroadcastHighPriority] = useState(false);
    const [lastBroadcast, setLastBroadcast] = useState(null);
    const [savingRequestId, setSavingRequestId] = useState(null);
    const unresolved = incidents.filter(i => i.status !== "RESOLVED").length;
    const criticalCount = incidents.filter(i => i.urgency === "Critical" || i.urgency === "High").length;
    const allocated = toNumber(resourceSummary.allocated);
    const remaining = toNumber(resourceSummary.remaining);
    const readiness = toNumber(resourceSummary.readiness);
    const purchaseRequests = resourceData.purchaseRequests || [];
    const pendingRequests = purchaseRequests.filter(isPendingRequest);
    const completedRequestCount = purchaseRequests.length - pendingRequests.length;
    const statusBuckets = [
        { label: "Pending", statuses: ["PENDING"], color: "var(--amber-500)" },
        { label: "Responding", statuses: ["RESPONDING", "IN_PROGRESS"], color: "var(--blue-600)" },
        { label: "Resolved", statuses: ["RESOLVED"], color: "var(--green-600)" },
    ].map((bucket) => ({
        ...bucket,
        count: incidents.filter((incident) => bucket.statuses.includes((incident.status || "PENDING").toUpperCase())).length,
    }));
    const recentActivity = [
        ...incidents.slice(0, 3).map((incident) => ({
            key: `incident-${incident.id}`,
            actor: incident.reporterName || "Resident",
            action: `${formatStatusLabel(incident.status)} ${incident.type || "Emergency Report"}`,
            time: incident.createdAt ? new Date(incident.createdAt).toLocaleString() : getReportLocation(incident),
        })),
        ...purchaseRequests.slice(0, 2).map((request) => ({
            key: `request-${request.id}`,
            actor: request.requester || "Captain",
            action: `${formatStatusLabel(request.status)} ${request.item}`,
            time: formatMoney(request.amount),
        })),
    ].slice(0, 5);

    const handleRequestStatus = async (request, status) => {
        try {
            setSavingRequestId(request.id);
            await updatePurchaseRequest(request.id, { ...request, status });
            await onRefreshResources?.();
        } catch (err) {
            console.error("Purchase request update failed:", err);
            alert("Failed to update purchase request.");
        } finally {
            setSavingRequestId(null);
        }
    };

    const handleBroadcast = () => {
        const message = broadcastMessage.trim();
        if (!message) return;
        setLastBroadcast({
            priority: broadcastHighPriority ? "High priority" : "Standard",
            sentAt: new Date().toLocaleTimeString(),
        });
        setBroadcastMessage("");
        setBroadcastHighPriority(false);
    };

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
                    <div className="rb-stat-value">{formatMoney(remaining)}</div>
                    <div className="rb-stat-sub">{allocated > 0 ? `${Math.round((remaining / allocated) * 100)}% of disaster budget left` : "No budget lines recorded"}</div>
                </div>
                <div className="rb-stat-card blue">
                    <div className="rb-stat-icon blue"><Package size={24} /></div>
                    <div className="rb-stat-label">Resource Level</div>
                    <div className="rb-stat-value">{readiness}%</div>
                    <div className="rb-stat-sub">{resourceSummary.lowStockCount || 0} item{resourceSummary.lowStockCount === 1 ? "" : "s"} below minimum stock</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div>
                    <div className="rb-section-header">
                        <div className="rb-section-title">Critical Approvals Required</div>
                        <span className="rb-badge emergency">{pendingRequests.length} Pending</span>
                    </div>
                    <div className="rb-card">
                        <div className="rb-card-body" style={{ padding: 0 }}>
                            {pendingRequests.length === 0 && (
                                <div className="rb-empty-text" style={{ padding: 18 }}>No purchase requests need approval.</div>
                            )}
                            {pendingRequests.slice(0, 4).map((request) => (
                                <div key={request.id} className="approval-item">
                                    <div className="app-info">
                                        <div className="app-title">{request.item}</div>
                                        <div className="app-meta">
                                            Requested by: <strong>{request.requester || "Captain"}</strong> | Priority: {request.priority || "Medium"} | Cost: {formatMoney(request.amount)}
                                        </div>
                                    </div>
                                    <div className="app-actions">
                                        <button
                                            className="rb-btn rb-btn-ghost rb-btn-sm"
                                            style={{ color: "var(--red-600)" }}
                                            disabled={savingRequestId === request.id}
                                            onClick={() => handleRequestStatus(request, "Rejected")}
                                        >
                                            Decline
                                        </button>
                                        <button
                                            className="rb-btn rb-btn-primary rb-btn-sm"
                                            style={{ background: "var(--green-600)" }}
                                            disabled={savingRequestId === request.id}
                                            onClick={() => handleRequestStatus(request, "Approved")}
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {completedRequestCount > 0 && (
                            <div className="rb-card-footer" style={{ padding: 12, textAlign: "center", borderTop: "1px solid var(--gray-100)" }}>
                                <span className="rb-empty-text">{completedRequestCount} completed request{completedRequestCount === 1 ? "" : "s"}</span>
                            </div>
                        )}
                    </div>

                    <div className="rb-section-title" style={{ marginTop: 24, marginBottom: 16 }}>Response Team Efficiency</div>
                    <div className="rb-card">
                        <div className="rb-card-body">
                            <div className="response-metrics">
                                {statusBuckets.map((bucket) => {
                                    const percent = incidents.length > 0 ? Math.round((bucket.count / incidents.length) * 100) : 0;
                                    return (
                                        <div key={bucket.label} className="response-metric">
                                            <div className="response-metric-top">
                                                <span>{bucket.label}</span>
                                                <strong>{bucket.count}</strong>
                                            </div>
                                            <div className="response-bar">
                                                <div className="response-bar-fill" style={{ width: `${percent}%`, background: bucket.color }} />
                                            </div>
                                            <div className="response-percent">{percent}% of current reports</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="rb-card" style={{ marginBottom: 20 }}>
                        <div className="rb-card-header"><div className="rb-card-title">Captain's Broadcast</div></div>
                        <div className="rb-card-body">
                            <textarea
                                className="rb-textarea"
                                placeholder="Broadcast message to all residents..."
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                            />
                            <div className="rb-divider"></div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <Siren size={14} style={{ marginRight: 8 }} />
                                <span style={{ fontSize: 11, fontWeight: 600 }}>High Priority Alert</span>
                                <input
                                    type="checkbox"
                                    className="rb-toggle-input"
                                    style={{ marginLeft: "auto" }}
                                    checked={broadcastHighPriority}
                                    onChange={(e) => setBroadcastHighPriority(e.target.checked)}
                                />
                            </div>
                            <button
                                className="rb-btn rb-btn-primary"
                                style={{ width: "100%" }}
                                disabled={!broadcastMessage.trim()}
                                onClick={handleBroadcast}
                            >
                                <Megaphone size={16} style={{ marginRight: 8 }} /> Send Broadcast
                            </button>
                            {lastBroadcast && (
                                <div className="broadcast-status">
                                    Last sent {lastBroadcast.sentAt} | {lastBroadcast.priority}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rb-card">
                        <div className="rb-card-header"><div className="rb-card-title">Council Activity</div></div>
                        <div className="rb-card-body" style={{ padding: "10px 0" }}>
                            {recentActivity.length === 0 && <div className="rb-empty-text" style={{ padding: 16 }}>No recent activity yet.</div>}
                            {recentActivity.map((l) => (
                                <div key={l.key} className="mini-log-item">
                                    <div className="rb-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{l.actor[0]}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12 }}><strong>{l.actor}</strong> {l.action}</div>
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

class CaptainTabErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error("Captain tab crashed:", error, info);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="rb-card">
                    <div className="rb-card-body" style={{ padding: 28, textAlign: "center" }}>
                        <div className="rb-section-title" style={{ marginBottom: 8 }}>This section could not load</div>
                        <div style={{ color: "var(--gray-500)", fontSize: 13 }}>
                            Try switching tabs and coming back. The rest of the dashboard is still available.
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const getStockStatus = (resource) => {
    const stock = toNumber(resource.stock);
    const minimum = toNumber(resource.minimumStock);
    if (stock <= minimum) return { label: "Low Stock", className: "emergency" };
    if (stock <= minimum * 1.5) return { label: "Watch", className: "warn" };
    return { label: "Ready", className: "green" };
};

const BudgetResources = ({ data, isLoading, onRefresh }) => {
    const budgetLines = data?.budgetLines || [];
    const resources = data?.resources || [];
    const purchaseRequests = data?.purchaseRequests || [];
    const summary = data?.summary || EMPTY_RESOURCE_DASHBOARD.summary;
    const [budgetForm, setBudgetForm] = useState({ label: "", allocated: "", spent: "", color: "var(--red-600)" });
    const [resourceForm, setResourceForm] = useState({ name: "", category: "", unit: "", stock: "", minimumStock: "", targetStock: "", location: "" });
    const [requestForm, setRequestForm] = useState({ item: "", amount: "", priority: "Medium", status: "Pending" });
    const [saving, setSaving] = useState(false);

    const adjustStock = (resourceId, amount) => {
        const resource = resources.find((item) => item.id === resourceId);
        if (!resource) return;
        updateResourceItem(resourceId, { ...resource, stock: Math.max(0, toNumber(resource.stock) + amount) })
            .then(onRefresh)
            .catch((err) => {
                console.error("Resource update failed:", err);
                alert("Failed to update stock.");
            });
    };

    const handleCreateBudgetLine = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await createBudgetLine({
                ...budgetForm,
                allocated: toNumber(budgetForm.allocated),
                spent: toNumber(budgetForm.spent),
            });
            setBudgetForm({ label: "", allocated: "", spent: "", color: "var(--red-600)" });
            await onRefresh();
        } catch (err) {
            console.error("Budget line create failed:", err);
            alert("Failed to add budget line.");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateResource = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await createResourceItem({
                ...resourceForm,
                stock: toNumber(resourceForm.stock),
                minimumStock: toNumber(resourceForm.minimumStock),
                targetStock: Math.max(toNumber(resourceForm.targetStock), 1),
            });
            setResourceForm({ name: "", category: "", unit: "", stock: "", minimumStock: "", targetStock: "", location: "" });
            await onRefresh();
        } catch (err) {
            console.error("Resource create failed:", err);
            alert("Failed to add resource item.");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateRequest = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await createPurchaseRequest({
                ...requestForm,
                amount: toNumber(requestForm.amount),
            });
            setRequestForm({ item: "", amount: "", priority: "Medium", status: "Pending" });
            await onRefresh();
        } catch (err) {
            console.error("Purchase request create failed:", err);
            alert("Failed to add purchase request.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="captain-resources">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Budget & Resource Tracking</div>
                    <div className="rb-section-sub">Monitor disaster funds, stock levels, and procurement requests</div>
                </div>
                <div className="rb-header-actions">
                    <button className="rb-btn rb-btn-ghost" type="button" onClick={onRefresh}>
                        <FileText size={16} style={{ marginRight: 6 }} /> Export
                    </button>
                </div>
            </div>

            {isLoading && <div className="rb-loading">Loading budget and resources...</div>}

            <div className="rb-stat-grid">
                <div className="rb-stat-card green">
                    <div className="rb-stat-icon green"><Wallet size={24} /></div>
                    <div className="rb-stat-label">Available Budget</div>
                    <div className="rb-stat-value">{formatMoney(summary.remaining)}</div>
                    <div className="rb-stat-sub">{toNumber(summary.allocated) > 0 ? Math.round((toNumber(summary.remaining) / toNumber(summary.allocated)) * 100) : 0}% remaining this cycle</div>
                </div>
                <div className="rb-stat-card">
                    <div className="rb-stat-icon blue"><TrendingUp size={24} /></div>
                    <div className="rb-stat-label">Spent to Date</div>
                    <div className="rb-stat-value">{formatMoney(summary.spent)}</div>
                    <div className="rb-stat-sub">Across {budgetLines.length} budget lines</div>
                </div>
                <div className="rb-stat-card amber">
                    <div className="rb-stat-icon amber"><Archive size={24} /></div>
                    <div className="rb-stat-label">Resource Readiness</div>
                    <div className="rb-stat-value">{toNumber(summary.readiness)}%</div>
                    <div className="rb-stat-sub">{summary.lowStockCount || 0} item{summary.lowStockCount === 1 ? "" : "s"} below minimum stock</div>
                </div>
                <div className="rb-stat-card red">
                    <div className="rb-stat-icon red"><ShoppingCart size={24} /></div>
                    <div className="rb-stat-label">Pending Requests</div>
                    <div className="rb-stat-value">{summary.pendingRequestCount || 0}</div>
                    <div className="rb-stat-sub">{formatMoney(summary.pendingRequestAmount)} awaiting action</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div>
                    <div className="rb-card" style={{ marginBottom: 24 }}>
                        <div className="rb-card-header">
                            <div className="rb-card-title">Budget Allocation</div>
                            <span className="rb-badge info">{formatMoney(summary.allocated)} total</span>
                        </div>
                        <div className="rb-card-body">
                            <form className="resource-form" onSubmit={handleCreateBudgetLine}>
                                <input required placeholder="Budget line" value={budgetForm.label} onChange={(e) => setBudgetForm({ ...budgetForm, label: e.target.value })} />
                                <input required type="number" min="0" placeholder="Allocated" value={budgetForm.allocated} onChange={(e) => setBudgetForm({ ...budgetForm, allocated: e.target.value })} />
                                <input type="number" min="0" placeholder="Spent" value={budgetForm.spent} onChange={(e) => setBudgetForm({ ...budgetForm, spent: e.target.value })} />
                                <button className="rb-btn rb-btn-primary rb-btn-sm" disabled={saving} type="submit">Add</button>
                            </form>
                            <div className="budget-lines">
                                {budgetLines.length === 0 && <div className="rb-empty-text">No budget lines yet.</div>}
                                {budgetLines.map((line) => {
                                    const percent = line.allocated > 0 ? Math.min(100, Math.round((line.spent / line.allocated) * 100)) : 0;
                                    return (
                                        <div key={line.label} className="budget-line">
                                            <div className="budget-line-top">
                                                <div>
                                                    <div className="budget-line-title">{line.label}</div>
                                                    <div className="budget-line-meta">{formatMoney(line.spent)} spent of {formatMoney(line.allocated)}</div>
                                                </div>
                                                <strong>{percent}%</strong>
                                            </div>
                                            <div className="budget-progress">
                                                <div className="budget-progress-fill" style={{ width: `${percent}%`, background: line.color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="rb-card">
                        <div className="rb-card-header">
                            <div className="rb-card-title">Inventory & Supplies</div>
                            <span className="rb-badge responding">{resources.length} tracked</span>
                        </div>
                        <div className="rb-card-body">
                            <form className="resource-form resource-form-wide" onSubmit={handleCreateResource}>
                                <input required placeholder="Resource name" value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} />
                                <input placeholder="Category" value={resourceForm.category} onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })} />
                                <input placeholder="Unit" value={resourceForm.unit} onChange={(e) => setResourceForm({ ...resourceForm, unit: e.target.value })} />
                                <input type="number" min="0" placeholder="Stock" value={resourceForm.stock} onChange={(e) => setResourceForm({ ...resourceForm, stock: e.target.value })} />
                                <input type="number" min="0" placeholder="Minimum" value={resourceForm.minimumStock} onChange={(e) => setResourceForm({ ...resourceForm, minimumStock: e.target.value })} />
                                <input type="number" min="1" placeholder="Target" value={resourceForm.targetStock} onChange={(e) => setResourceForm({ ...resourceForm, targetStock: e.target.value })} />
                                <input placeholder="Location" value={resourceForm.location} onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })} />
                                <button className="rb-btn rb-btn-primary rb-btn-sm" disabled={saving} type="submit">Add</button>
                            </form>
                        </div>
                        <div className="rb-table-wrap">
                            <table className="rb-table">
                                <thead>
                                    <tr>
                                        <th>Resource</th>
                                        <th>Category</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Location</th>
                                        <th style={{ textAlign: "right" }}>Adjust</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resources.map((resource) => {
                                        const stockStatus = getStockStatus(resource);
                                        return (
                                            <tr key={resource.id}>
                                                <td>
                                                    <strong>{resource.name}</strong>
                                                    <div style={{ fontSize: 11, color: "var(--gray-400)" }}>Minimum: {resource.minimumStock || 0} {resource.unit}</div>
                                                </td>
                                                <td>{resource.category}</td>
                                                <td>{resource.stock || 0} {resource.unit}</td>
                                                <td><span className={`rb-badge ${stockStatus.className}`}>{stockStatus.label}</span></td>
                                                <td style={{ color: "var(--gray-500)", fontSize: 12 }}>{resource.location}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="resource-adjust">
                                                        <button type="button" onClick={() => adjustStock(resource.id, -10)}><Minus size={13} /></button>
                                                        <button type="button" onClick={() => adjustStock(resource.id, 10)}><Plus size={13} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="rb-card" style={{ marginBottom: 20 }}>
                        <div className="rb-card-header">
                            <div className="rb-card-title">Procurement Queue</div>
                        </div>
                        <div className="rb-card-body" style={{ padding: 0 }}>
                            <form className="resource-form resource-request-form" onSubmit={handleCreateRequest}>
                                <input required placeholder="Request item" value={requestForm.item} onChange={(e) => setRequestForm({ ...requestForm, item: e.target.value })} />
                                <input type="number" min="0" placeholder="Amount" value={requestForm.amount} onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })} />
                                <select value={requestForm.priority} onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}>
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                                <button className="rb-btn rb-btn-primary rb-btn-sm" disabled={saving} type="submit">Add Request</button>
                            </form>
                            {purchaseRequests.length === 0 && <div style={{ padding: 18, color: "var(--gray-500)", fontSize: 13 }}>No purchase requests yet.</div>}
                            {purchaseRequests.map((request, index) => (
                                <div key={request.item} className="purchase-request">
                                    <div className="purchase-request-icon">
                                        {index === 0 ? <Truck size={16} /> : <ClipboardCheck size={16} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="purchase-request-title">{request.item}</div>
                                        <div className="purchase-request-meta">{request.requester} · {formatMoney(request.amount)}</div>
                                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                            <span className={`rb-badge ${request.priority === "High" ? "emergency" : "warn"}`}>{request.priority}</span>
                                            <span className="rb-badge pending">{request.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rb-card">
                        <div className="rb-card-header">
                            <div className="rb-card-title">Operational Notes</div>
                        </div>
                        <div className="rb-card-body">
                            <textarea
                                className="rb-textarea"
                                placeholder="Enter resource notes..."
                            />
                            <button className="rb-btn rb-btn-primary" style={{ width: "100%", marginTop: 12 }}>
                                Save Resource Notes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CaptainAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        body: "",
        category: "General",
        audience: "Residents",
        emergency: false,
    });

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            setAnnouncements(await getAnnouncements());
        } catch (err) {
            console.error("Fetch announcements error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await createAnnouncement(form);
            setForm({ title: "", body: "", category: "General", audience: "Residents", emergency: false });
            await fetchAnnouncements();
        } catch (err) {
            console.error("Create announcement error:", err);
            alert("Failed to post announcement.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="official-announcements">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Announcements</div>
                    <div className="rb-section-sub">Post official barangay advisories and emergency notices</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div className="rb-card">
                    <div className="rb-card-header">
                        <div className="rb-card-title">Published Announcements</div>
                        <span className="rb-badge info">{announcements.length} Posts</span>
                    </div>
                    <div className="rb-card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="rb-empty-small" style={{ padding: 20, color: "var(--gray-500)" }}>Loading announcements...</div>
                        ) : announcements.length === 0 ? (
                            <div className="rb-empty-small" style={{ padding: 20, color: "var(--gray-500)" }}>No announcements posted yet.</div>
                        ) : announcements.map((announcement) => (
                            <div key={announcement.id} className={`official-announcement-item${announcement.emergency ? " emergency" : ""}`}>
                                <div className="official-announcement-title">
                                    {announcement.emergency && <Siren size={15} style={{ marginRight: 6 }} />}
                                    {announcement.title}
                                </div>
                                <div className="official-announcement-body">{announcement.body}</div>
                                <div className="official-announcement-meta">
                                    <span className={`rb-badge ${announcement.emergency ? "emergency" : "info"}`}>{announcement.category || "General"}</span>
                                    <span>{announcement.audience || "Residents"}</span>
                                    <span>{announcement.authorName || "Captain"}</span>
                                    <span>{announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : "Just now"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="rb-card">
                        <div className="rb-card-header">
                            <div className="rb-card-title">Create Announcement</div>
                        </div>
                        <div className="rb-card-body">
                            <form className="official-form" onSubmit={handleSubmit}>
                                <input
                                    required
                                    placeholder="Announcement title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                                <textarea
                                    required
                                    placeholder="Write the announcement details..."
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                />
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    <option>General</option>
                                    <option>Weather</option>
                                    <option>Evacuation</option>
                                    <option>Health</option>
                                    <option>Emergency</option>
                                </select>
                                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                                    <option>Residents</option>
                                    <option>Officials</option>
                                    <option>Responders</option>
                                    <option>Everyone</option>
                                </select>
                                <label className="official-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={form.emergency}
                                        onChange={(e) => setForm({ ...form, emergency: e.target.checked, category: e.target.checked ? "Emergency" : form.category })}
                                    />
                                    Mark as emergency alert
                                </label>
                                <button className="rb-btn rb-btn-primary" disabled={saving} type="submit">
                                    <Send size={16} style={{ marginRight: 8 }} /> {saving ? "Posting..." : "Post Announcement"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ---- SCREEN: PROFILE / HANDOVER ----
const CaptainProfile = ({ user }) => {
    const { updateUser } = useAuth();
    const fileInputRef = useRef(null);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        contactNumber: user?.contactNumber || "",
        address: user?.address || "",
        barangay: user?.barangay || "",
        cityName: user?.cityName || user?.city || "",
        provinceName: user?.provinceName || user?.province || "",
        regionName: user?.regionName || user?.region || "",
        bio: user?.bio || "Serving the community.",
        profileVisibility: user?.profileVisibility || "OFFICIALS",
    });

    const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.trim()
        || user?.email?.[0]?.toUpperCase()
        || "C";
    const profileImageUrl = user?.profilePictureUrl
        ? (user.profilePictureUrl.startsWith("http") ? user.profilePictureUrl : `http://localhost:8080${user.profilePictureUrl}`)
        : null;
    const fullName = `${form.firstName || user?.firstName || ""} ${form.lastName || user?.lastName || ""}`.trim() || "Barangay Captain";

    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const response = await updateProfile(form);
            updateUser(response.data?.user || form);
            setSaved(true);
            setEditMode(false);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Captain profile update failed:", err);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setAvatarUploading(true);
        try {
            const response = await uploadProfilePicture(file);
            const newUrl = response.data?.profilePictureUrl || response.data?.user?.profilePictureUrl || "";
            updateUser({ profilePictureUrl: newUrl });
        } catch (err) {
            console.error("Captain profile picture upload failed:", err);
            alert("Failed to upload profile picture.");
        } finally {
            setAvatarUploading(false);
            event.target.value = "";
        }
    };

    const handleTransferClick = () => {
        setShowConfirmModal(true);
    };

    return (
        <div className="profile-container captain-profile" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            <div className="topbar">
                <div className="topbar-left">
                    <span className="topbar-page-title">Captain Profile</span>
                    <span className="topbar-breadcrumb">Executive account settings and ownership</span>
                </div>
                <div className="topbar-right">
                    <button className="topbar-icon-btn">
                        <Bell size={20} />
                        <span className="topbar-notif-dot" />
                    </button>
                    <div className="topbar-avatar">{initials}</div>
                </div>
            </div>

            <div className="page-body">
                <div className="profile-banner">
                    <div className="profile-banner-bg-orb" />
                    <div className="profile-banner-bg-ring" />

                    <div className="profile-banner-left">
                        <div className="profile-avatar-wrap">
                            <div className="profile-avatar">
                                {profileImageUrl ? (
                                    <img src={profileImageUrl} alt="Profile" className="profile-avatar-img" />
                                ) : (
                                    initials
                                )}
                            </div>
                            <button
                                className="profile-avatar-edit"
                                onClick={handleAvatarButtonClick}
                                disabled={avatarUploading}
                                title={avatarUploading ? "Uploading..." : "Change profile picture"}
                            >
                                <Camera size={16} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <div className="profile-banner-info">
                            <div className="profile-role-chip">
                                <span className="profile-role-dot" />
                                Barangay Captain
                            </div>
                            <h1 className="profile-name">{fullName}</h1>
                            <div className="profile-meta-row">
                                <span className="profile-meta-item"><MapPin size={14} style={{ marginRight: 6 }} /> {form.barangay || "No Barangay assigned"}</span>
                                <span className="profile-meta-sep">·</span>
                                <span className="profile-meta-item"><Mail size={14} style={{ marginRight: 6 }} /> {form.email || user?.email}</span>
                                <span className="profile-meta-sep">·</span>
                                <span className="profile-meta-item"><Calendar size={14} style={{ marginRight: 6 }} /> Captain account</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-banner-right">
                        <div className="profile-banner-stat">
                            <div className="profile-banner-stat-num">Live</div>
                            <div className="profile-banner-stat-label">Command Role</div>
                        </div>
                        <div className="profile-banner-stat-div" />
                        <div className="profile-banner-stat">
                            <div className="profile-banner-stat-num">{form.profileVisibility === "RESIDENTS" ? "Public" : form.profileVisibility === "PRIVATE" ? "Private" : "Staff"}</div>
                            <div className="profile-banner-stat-label">Visibility</div>
                        </div>
                    </div>
                </div>

                <div className="profile-tabs">
                    <button className="profile-tab active" type="button">Overview</button>
                </div>

                <div className="profile-tab-content">
                    <div className="profile-two-col">
                        <div className="profile-card">
                            <div className="profile-card-header">
                                <div className="profile-card-title"><User size={18} style={{ marginRight: 8 }} /> Personal Information</div>
                                <button
                                    className={`profile-edit-btn${editMode ? " cancel" : ""}`}
                                    onClick={() => setEditMode(!editMode)}
                                    type="button"
                                >
                                    {editMode ? "Cancel" : <><Edit size={14} style={{ marginRight: 6 }} /> Edit</>}
                                </button>
                            </div>

                            <div className="profile-fields">
                                <div className="profile-field-row">
                                    <div className="profile-field">
                                        <label className="profile-field-label">First Name</label>
                                        {editMode ? (
                                            <input className="profile-input" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
                                        ) : (
                                            <div className="profile-field-value">{form.firstName || "—"}</div>
                                        )}
                                    </div>
                                    <div className="profile-field">
                                        <label className="profile-field-label">Last Name</label>
                                        {editMode ? (
                                            <input className="profile-input" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
                                        ) : (
                                            <div className="profile-field-value">{form.lastName || "—"}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="profile-field">
                                    <label className="profile-field-label">Email Address</label>
                                    <div className="profile-field-value locked">
                                        {form.email || user?.email || "—"}
                                        <span className="profile-lock-badge"><Lock size={12} style={{ marginRight: 4 }} /> Login</span>
                                    </div>
                                </div>

                                <div className="profile-field">
                                    <label className="profile-field-label">Phone Number</label>
                                    {editMode ? (
                                        <input className="profile-input" type="tel" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} />
                                    ) : (
                                        <div className="profile-field-value">{form.contactNumber || "—"}</div>
                                    )}
                                </div>

                                <div className="profile-field">
                                    <label className="profile-field-label">Position / Role</label>
                                    <div className="profile-field-value locked">
                                        {user?.role || "Barangay Captain"}
                                        <span className="profile-lock-badge"><Lock size={12} style={{ marginRight: 4 }} /> Locked</span>
                                    </div>
                                </div>

                                <div className="profile-field">
                                    <label className="profile-field-label">Bio</label>
                                    {editMode ? (
                                        <textarea
                                            className="profile-input profile-textarea"
                                            value={form.bio}
                                            onChange={(e) => update("bio", e.target.value)}
                                            rows={3}
                                        />
                                    ) : (
                                        <div className="profile-field-value profile-bio">{form.bio || "—"}</div>
                                    )}
                                </div>

                                {editMode && (
                                    <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving} type="button">
                                        {saving ? "Saving..." : "Save Changes ->"}
                                    </button>
                                )}

                                {saved && (
                                    <div className="profile-saved-toast"><CheckCircle2 size={16} style={{ marginRight: 8 }} /> Profile updated successfully!</div>
                                )}
                            </div>
                        </div>

                        <div className="profile-card">
                            <div className="profile-card-header">
                                <div className="profile-card-title"><Lock size={18} style={{ marginRight: 8 }} /> Privacy & Visibility</div>
                            </div>
                            <div className="profile-fields">
                                <div className="profile-field">
                                    <label className="profile-field-label">Directory Visibility</label>
                                    <select
                                        className="profile-input"
                                        value={form.profileVisibility}
                                        onChange={(e) => update("profileVisibility", e.target.value)}
                                    >
                                        <option value="PRIVATE">Private (Only me)</option>
                                        <option value="OFFICIALS">Officials Only (Searchable by other Officials)</option>
                                        <option value="RESIDENTS">All Residents (Searchable by everyone)</option>
                                    </select>
                                    <p style={{ fontSize: 11, color: "var(--text-light)", marginTop: 4 }}>
                                        Controls who can see your profile in the Community Directory.
                                    </p>
                                </div>
                                <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving} type="button">
                                    {saving ? "Saving..." : "Save Visibility"}
                                </button>
                                {saved && (
                                    <div className="profile-saved-toast"><CheckCircle2 size={16} style={{ marginRight: 8 }} /> Settings saved successfully!</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-card profile-card-full" style={{ marginTop: 16 }}>
                        <div className="profile-card-header">
                            <div className="profile-card-title"><Building2 size={18} style={{ marginRight: 8 }} /> Barangay Information</div>
                            <button
                                className={`profile-edit-btn${editMode ? " cancel" : ""}`}
                                onClick={() => setEditMode(!editMode)}
                                type="button"
                            >
                                {editMode ? "Cancel" : <><Edit size={14} style={{ marginRight: 6 }} /> Edit</>}
                            </button>
                        </div>
                        <div className="profile-fields profile-fields-max">
                            <div className="profile-field-row">
                                <div className="profile-field">
                                    <label className="profile-field-label">Barangay Name</label>
                                    {editMode ? (
                                        <input className="profile-input" value={form.barangay} onChange={(e) => update("barangay", e.target.value)} />
                                    ) : (
                                        <div className="profile-field-value">{form.barangay || "—"}</div>
                                    )}
                                </div>
                                <div className="profile-field">
                                    <label className="profile-field-label">Municipality / City</label>
                                    {editMode ? (
                                        <input className="profile-input" value={form.cityName} onChange={(e) => update("cityName", e.target.value)} />
                                    ) : (
                                        <div className="profile-field-value">{form.cityName || "—"}</div>
                                    )}
                                </div>
                            </div>
                            <div className="profile-field-row">
                                <div className="profile-field">
                                    <label className="profile-field-label">Province / Region</label>
                                    {editMode ? (
                                        <input className="profile-input" value={`${form.provinceName}${form.regionName ? ` - ${form.regionName}` : ""}`} readOnly />
                                    ) : (
                                        <div className="profile-field-value">
                                            {form.provinceName || "—"} - {form.regionName || "—"}
                                        </div>
                                    )}
                                </div>
                                <div className="profile-field">
                                    <label className="profile-field-label">Specific Address</label>
                                    {editMode ? (
                                        <input className="profile-input" value={form.address} onChange={(e) => update("address", e.target.value)} />
                                    ) : (
                                        <div className="profile-field-value">{form.address || "—"}</div>
                                    )}
                                </div>
                            </div>
                            {editMode && (
                                <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving} type="button">
                                    {saving ? "Saving..." : "Save Barangay Info ->"}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="profile-danger-zone">
                        <div className="profile-danger-title"><AlertTriangle size={18} style={{ marginRight: 8 }} /> Captain Ownership Transfer</div>
                        <div className="profile-danger-row">
                            <div>
                                <div className="profile-danger-action-label">Transfer Captain Ownership</div>
                                <div className="profile-danger-action-sub">
                                    Initiate the transfer process with the new Captain's details and proof of election. Admin approval is required before privileges change.
                                </div>
                            </div>
                            <button className="profile-danger-btn solid" onClick={handleTransferClick} disabled={saving} type="button">
                                Transfer Ownership
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <TransferOwnershipModal
                show={showConfirmModal}
                onClose={(success) => {
                    setShowConfirmModal(false);
                    if (success === true) {
                        setSaved(true);
                        setTimeout(() => setSaved(false), 3000);
                    }
                }}
            />
        </div>
    );
};

// ---- SCREEN: INCIDENT MANAGEMENT ----
const IncidentManagement = ({ incidents, onRefresh }) => {
    const [selectedIncident, setSelectedIncident] = useState(null);

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
    const [resourceData, setResourceData] = useState(EMPTY_RESOURCE_DASHBOARD);
    const [resourcesLoading, setResourcesLoading] = useState(false);

    const fetchIncidents = async () => {
        try {
            const res = await getReports();
            setIncidents(res.data);
        } catch (err) {
            console.error("Fetch incidents error:", err);
        }
    };

    const fetchResources = async () => {
        try {
            setResourcesLoading(true);
            const data = await getResourceDashboard();
            setResourceData({
                ...EMPTY_RESOURCE_DASHBOARD,
                ...data,
                summary: {
                    ...EMPTY_RESOURCE_DASHBOARD.summary,
                    ...(data?.summary || {}),
                },
            });
        } catch (err) {
            console.error("Fetch resources error:", err);
            setResourceData(EMPTY_RESOURCE_DASHBOARD);
        } finally {
            setResourcesLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
        fetchResources();
        const interval = setInterval(fetchIncidents, 30000); // 30s polling
        return () => clearInterval(interval);
    }, []);

    const screens = {
        overview: (
            <CommandOverview
                incidents={incidents}
                resourceSummary={resourceData.summary}
                resourceData={resourceData}
                onRefreshResources={fetchResources}
            />
        ),
        incidents: <IncidentManagement incidents={incidents} onRefresh={fetchIncidents} />,
        evacuation: <ManageEvacuationCenters />,
        resources: <BudgetResources data={resourceData} isLoading={resourcesLoading} onRefresh={fetchResources} />,
        personnel: <PersonnelManagement />,
        announcements: <CaptainAnnouncements />,
        profile: <CaptainProfile user={user} />,
    };

    useEffect(() => {
        if (!VALID_CAPTAIN_TABS.has(active)) {
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
                <CaptainTabErrorBoundary resetKey={active}>
                    {screens[active] || screens.overview}
                </CaptainTabErrorBoundary>
            </div>
        </div>
    );
}
