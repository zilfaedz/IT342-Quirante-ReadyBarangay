import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Activity, Archive, Bell, Building2, Calendar, Camera, CheckCircle2,
    ClipboardCheck, Edit, Home, Lock, Mail, MapPin, Minus, Package, Plus,
    Search, Send, ShoppingCart, Siren, Truck, User, Wallet
} from "lucide-react";
import "./DashboardOfficial.css";
import "../profile/Profile.css";
import "../../global.css";
import LogoutModal from "../../shared/layout/LogoutModal";
import ManageEvacuationCenters from "../evacuation-centers/ManageEvacuationCenters";
import { useAuth } from "../../shared/auth/AuthContext";
import {
    createAnnouncement,
    createPurchaseRequest,
    createResourceItem,
    getAnnouncements,
    getCommunityDirectory,
    getEvacuationCenters,
    getReports,
    getResourceDashboard,
    updateProfile,
    updateResourceItem,
    uploadProfilePicture,
} from "../../shared/api/api";

const VALID_OFFICIAL_TABS = new Set(["overview", "evacuation", "directory", "announcements", "resources", "profile"]);

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
const statusClass = (status) => (status || "pending").toLowerCase();
const getStockStatus = (resource) => {
    const stock = toNumber(resource.stock);
    const minimum = toNumber(resource.minimumStock);
    if (stock <= minimum) return { label: "Low Stock", className: "emergency" };
    if (stock <= minimum * 1.5) return { label: "Watch", className: "warn" };
    return { label: "Ready", className: "green" };
};

const Overview = ({ incidents, directoryCount, evacuationCenters }) => {
    const pendingCount = incidents.filter(i => i.status === "PENDING").length;
    const respondingCount = incidents.filter(i => ["RESPONDING", "IN_PROGRESS"].includes((i.status || "").toUpperCase())).length;
    const resolvedCount = incidents.filter(i => i.status === "RESOLVED").length;
    const activeCount = incidents.filter(i => i.status !== "RESOLVED").length;
    const criticalCount = incidents.filter(i => ["HIGH", "CRITICAL"].includes((i.urgency || "").toUpperCase())).length;
    const recentIncidents = incidents.slice(0, 6);

    return (
        <div className="official-overview">
            <div className="rb-stat-grid">
                <div className="rb-stat-card">
                    <div className="rb-stat-icon red"><Siren size={24} /></div>
                    <div className="rb-stat-label">Active Incidents</div>
                    <div className="rb-stat-value">{activeCount}</div>
                    <div className="rb-stat-sub">{pendingCount} pending review</div>
                </div>
                <div className="rb-stat-card amber">
                    <div className="rb-stat-icon amber"><Activity size={24} /></div>
                    <div className="rb-stat-label">Response Activity</div>
                    <div className="rb-stat-value">{respondingCount}</div>
                    <div className="rb-stat-sub">{resolvedCount} resolved reports</div>
                </div>
                <div className="rb-stat-card green">
                    <div className="rb-stat-icon green"><Building2 size={24} /></div>
                    <div className="rb-stat-label">Evacuation Centers</div>
                    <div className="rb-stat-value">{evacuationCenters.length}</div>
                    <div className="rb-stat-sub">{evacuationCenters.filter(c => c.status === "ACTIVE" || c.isActive).length} active centers</div>
                </div>
                <div className="rb-stat-card blue">
                    <div className="rb-stat-icon blue"><Home size={24} /></div>
                    <div className="rb-stat-label">Registered Residents</div>
                    <div className="rb-stat-value">{directoryCount}</div>
                    <div className="rb-stat-sub">Visible in barangay directory</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div className="rb-card">
                    <div className="rb-card-header">
                        <div className="rb-card-title">Incident Queue</div>
                        <span className="rb-badge emergency">{criticalCount} Priority</span>
                    </div>
                    <div className="rb-card-body" style={{ padding: 0 }}>
                        {recentIncidents.length === 0 ? (
                            <div className="rb-empty-small" style={{ padding: 20, color: "var(--gray-500)" }}>No incident reports yet.</div>
                        ) : (
                            <div className="rb-table-wrap">
                                <table className="rb-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Resident</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentIncidents.map((incident) => (
                                            <tr key={incident.id}>
                                                <td><code>INC-{incident.id}</code></td>
                                                <td>{incident.incidentType || "Report"}</td>
                                                <td>{incident.user?.firstName || "Resident"} {incident.user?.lastName || ""}</td>
                                                <td><span className={`rb-badge ${incident.urgency?.toLowerCase() || "medium"}`}>{incident.urgency || "Medium"}</span></td>
                                                <td><span className={`rb-badge ${statusClass(incident.status)}`}>{incident.status || "PENDING"}</span></td>
                                                <td>{incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString() : "N/A"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                <div className="overview-sidebar">
                    <div className="rb-card" style={{ marginBottom: 20 }}>
                        <div className="rb-card-header"><div className="rb-card-title">Overview Breakdown</div></div>
                        <div className="rb-card-body">
                            <div className="status-toggle-item">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>Pending Reports</div>
                                    <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Awaiting official review</div>
                                </div>
                                <span className="rb-badge pending">{pendingCount}</span>
                            </div>
                            <div className="rb-divider"></div>
                            <div className="status-toggle-item">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>Responding</div>
                                    <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Currently being handled</div>
                                </div>
                                <span className="rb-badge responding">{respondingCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rb-card">
                        <div className="rb-card-header"><div className="rb-card-title">Recent Activity</div></div>
                        <div className="rb-card-body" style={{ padding: "10px 0" }}>
                            {recentIncidents.length === 0 && (
                                <div className="rb-empty-small" style={{ padding: 16, color: "var(--gray-500)" }}>No recent activity yet.</div>
                            )}
                            {recentIncidents.slice(0, 4).map((incident) => (
                                <div key={incident.id} className="mini-log-item">
                                    <div className={`log-dot ${(incident.incidentType || "system").toLowerCase()}`} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>{incident.user?.firstName || "Resident"} reported {incident.incidentType || "an incident"}</div>
                                        <div style={{ fontSize: 10, color: "var(--gray-400)" }}>{incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString() : "N/A"}</div>
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

const ResidentDirectory = () => {
    const [directory, setDirectory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        getCommunityDirectory()
            .then(res => setDirectory(res.data || []))
            .catch(err => console.error("Fetch directory error:", err))
            .finally(() => setLoading(false));
    }, []);

    const residents = directory.filter((resident) => (resident.role || "").toUpperCase() === "RESIDENT");
    const filtered = residents.filter((resident) => {
        const query = searchTerm.toLowerCase();
        return (resident.fullName || "").toLowerCase().includes(query)
            || (resident.purok || "").toLowerCase().includes(query)
            || (resident.role || "").toLowerCase().includes(query);
    });

    return (
        <div className="captain-personnel">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Personnel & Residents Directory</div>
                    <div className="rb-section-sub">View registered residents in your barangay directory</div>
                </div>
                <div className="rb-header-actions">
                    <button className="rb-btn rb-btn-ghost" type="button">
                        <Search size={16} style={{ marginRight: 6 }} /> Search
                    </button>
                </div>
            </div>

            <div className="rb-card" style={{ marginBottom: 24 }}>
                <div className="rb-card-header">
                    <div className="rb-card-title">Registered Residents</div>
                    <span className="rb-badge info">{filtered.length} Members</span>
                </div>
                <div className="rb-card-body" style={{ padding: 0 }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--gray-100)" }}>
                        <input className="rb-search-input" style={{ width: "100%", maxWidth: 420 }} placeholder="Search by name, purok, or role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    {loading ? (
                        <div className="rb-empty-small" style={{ padding: 20, color: "var(--gray-500)" }}>Loading directory...</div>
                    ) : filtered.length === 0 ? (
                        <div className="rb-empty-small" style={{ padding: 20, color: "var(--gray-500)" }}>No residents found.</div>
                    ) : (
                        <div className="rb-table-wrap">
                            <table className="rb-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Purok</th>
                                        <th>Role</th>
                                        <th style={{ textAlign: "right" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((resident, index) => (
                                        <tr key={`${resident.fullName}-${resident.purok}-${index}`}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div className="rb-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{(resident.fullName || "Resident")[0]}</div>
                                                    <strong>{resident.fullName || "Resident"}</strong>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{resident.purok || "N/A"}</td>
                                            <td style={{ textTransform: "capitalize" }}>{(resident.role || "Resident").toLowerCase()}</td>
                                            <td style={{ textAlign: "right" }}>
                                                {resident.verified ? <span className="rb-status-pill active">Verified</span> : <span className="rb-badge pending">Unverified</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AnnouncementsPanel = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: "", body: "", category: "General", audience: "Residents", emergency: false });

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
                                    <span>{announcement.authorName || "Official"}</span>
                                    <span>{announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : "Just now"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="rb-card">
                        <div className="rb-card-header"><div className="rb-card-title">Create Announcement</div></div>
                        <div className="rb-card-body">
                            <form className="official-form" onSubmit={handleSubmit}>
                                <input required placeholder="Announcement title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                <textarea required placeholder="Write the announcement details..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
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
                                    <input type="checkbox" checked={form.emergency} onChange={(e) => setForm({ ...form, emergency: e.target.checked, category: e.target.checked ? "Emergency" : form.category })} />
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

const OfficialResources = ({ data, isLoading, onRefresh }) => {
    const resources = data?.resources || [];
    const purchaseRequests = data?.purchaseRequests || [];
    const summary = data?.summary || EMPTY_RESOURCE_DASHBOARD.summary;
    const [resourceForm, setResourceForm] = useState({ name: "", category: "", unit: "", stock: "", minimumStock: "", targetStock: "", location: "" });
    const [requestForm, setRequestForm] = useState({ item: "", amount: "", priority: "Medium", status: "Pending" });
    const [saving, setSaving] = useState(false);

    const adjustStock = async (resourceId, amount) => {
        const resource = resources.find((item) => item.id === resourceId);
        if (!resource) return;
        try {
            await updateResourceItem(resourceId, { ...resource, stock: Math.max(0, toNumber(resource.stock) + amount) });
            await onRefresh();
        } catch (err) {
            console.error("Resource update failed:", err);
            alert("Failed to update stock.");
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
            await createPurchaseRequest({ ...requestForm, amount: toNumber(requestForm.amount) });
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
                    <div className="rb-section-title">Resource Inventory</div>
                    <div className="rb-section-sub">Track supplies and submit procurement requests</div>
                </div>
                <div className="rb-header-actions">
                    <button className="rb-btn rb-btn-ghost" type="button" onClick={onRefresh}>Refresh</button>
                </div>
            </div>

            {isLoading && <div className="rb-loading">Loading resources...</div>}

            <div className="rb-stat-grid">
                <div className="rb-stat-card amber">
                    <div className="rb-stat-icon amber"><Archive size={24} /></div>
                    <div className="rb-stat-label">Resource Readiness</div>
                    <div className="rb-stat-value">{toNumber(summary.readiness)}%</div>
                    <div className="rb-stat-sub">{summary.lowStockCount || 0} item{summary.lowStockCount === 1 ? "" : "s"} below minimum</div>
                </div>
                <div className="rb-stat-card blue">
                    <div className="rb-stat-icon blue"><Package size={24} /></div>
                    <div className="rb-stat-label">Tracked Items</div>
                    <div className="rb-stat-value">{resources.length}</div>
                    <div className="rb-stat-sub">Inventory records</div>
                </div>
                <div className="rb-stat-card red">
                    <div className="rb-stat-icon red"><ShoppingCart size={24} /></div>
                    <div className="rb-stat-label">Pending Requests</div>
                    <div className="rb-stat-value">{summary.pendingRequestCount || 0}</div>
                    <div className="rb-stat-sub">{formatMoney(summary.pendingRequestAmount)} awaiting action</div>
                </div>
                <div className="rb-stat-card green">
                    <div className="rb-stat-icon green"><Wallet size={24} /></div>
                    <div className="rb-stat-label">Available Budget</div>
                    <div className="rb-stat-value">{formatMoney(summary.remaining)}</div>
                    <div className="rb-stat-sub">Relief fund balance</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div className="rb-card">
                    <div className="rb-card-header">
                        <div className="rb-card-title">Inventory & Supplies</div>
                        <span className="rb-badge responding">{resources.length} tracked</span>
                    </div>
                    <div className="rb-card-body">
                        <form className="official-resource-form" onSubmit={handleCreateResource}>
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
                                {resources.length === 0 ? (
                                    <tr><td colSpan="6" style={{ color: "var(--gray-500)", padding: 18 }}>No resources yet.</td></tr>
                                ) : resources.map((resource) => {
                                    const stock = getStockStatus(resource);
                                    return (
                                        <tr key={resource.id}>
                                            <td>
                                                <strong>{resource.name}</strong>
                                                <div style={{ fontSize: 11, color: "var(--gray-400)" }}>Minimum: {resource.minimumStock || 0} {resource.unit}</div>
                                            </td>
                                            <td>{resource.category}</td>
                                            <td>{resource.stock || 0} {resource.unit}</td>
                                            <td><span className={`rb-badge ${stock.className}`}>{stock.label}</span></td>
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

                <div className="right-sidebar">
                    <div className="rb-card">
                        <div className="rb-card-header"><div className="rb-card-title">Procurement Queue</div></div>
                        <div className="rb-card-body" style={{ padding: 0 }}>
                            <form className="official-request-form" onSubmit={handleCreateRequest}>
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
                                <div key={request.id || request.item} className="purchase-request">
                                    <div className="purchase-request-icon">
                                        {index === 0 ? <Truck size={16} /> : <ClipboardCheck size={16} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="purchase-request-title">{request.item}</div>
                                        <div className="purchase-request-meta">{request.requester} | {formatMoney(request.amount)}</div>
                                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                            <span className={`rb-badge ${request.priority === "High" ? "emergency" : "warn"}`}>{request.priority}</span>
                                            <span className="rb-badge pending">{request.status}</span>
                                        </div>
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

const OfficialProfile = ({ user }) => {
    const { updateUser } = useAuth();
    const fileInputRef = useRef(null);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
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
        || "O";
    const profileImageUrl = user?.profilePictureUrl
        ? (user.profilePictureUrl.startsWith("http") ? user.profilePictureUrl : `http://localhost:8080${user.profilePictureUrl}`)
        : null;
    const fullName = `${form.firstName || user?.firstName || ""} ${form.lastName || user?.lastName || ""}`.trim() || "Barangay Official";
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
            console.error("Official profile update failed:", err);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setAvatarUploading(true);
        try {
            const response = await uploadProfilePicture(file);
            updateUser({ profilePictureUrl: response.data?.profilePictureUrl || response.data?.user?.profilePictureUrl || "" });
        } catch (err) {
            console.error("Official profile picture upload failed:", err);
            alert("Failed to upload profile picture.");
        } finally {
            setAvatarUploading(false);
            event.target.value = "";
        }
    };

    return (
        <div className="profile-container official-profile" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            <div className="page-body">
                <div className="profile-banner">
                    <div className="profile-banner-bg-orb" />
                    <div className="profile-banner-bg-ring" />

                    <div className="profile-banner-left">
                        <div className="profile-avatar-wrap">
                            <div className="profile-avatar">
                                {profileImageUrl ? <img src={profileImageUrl} alt="Profile" className="profile-avatar-img" /> : initials}
                            </div>
                            <button className="profile-avatar-edit" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading} type="button">
                                <Camera size={16} />
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                        </div>
                        <div className="profile-banner-info">
                            <div className="profile-role-chip">
                                <span className="profile-role-dot" />
                                Barangay Official
                            </div>
                            <h1 className="profile-name">{fullName}</h1>
                            <div className="profile-meta-row">
                                <span className="profile-meta-item"><MapPin size={14} style={{ marginRight: 6 }} /> {form.barangay || "No Barangay assigned"}</span>
                                <span className="profile-meta-sep">·</span>
                                <span className="profile-meta-item"><Mail size={14} style={{ marginRight: 6 }} /> {form.email || user?.email}</span>
                                <span className="profile-meta-sep">·</span>
                                <span className="profile-meta-item"><Calendar size={14} style={{ marginRight: 6 }} /> Official account</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-banner-right">
                        <div className="profile-banner-stat">
                            <div className="profile-banner-stat-num">Active</div>
                            <div className="profile-banner-stat-label">Official Role</div>
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
                                <button className={`profile-edit-btn${editMode ? " cancel" : ""}`} onClick={() => setEditMode(!editMode)} type="button">
                                    {editMode ? "Cancel" : <><Edit size={14} style={{ marginRight: 6 }} /> Edit</>}
                                </button>
                            </div>
                            <div className="profile-fields">
                                <div className="profile-field-row">
                                    <div className="profile-field">
                                        <label className="profile-field-label">First Name</label>
                                        {editMode ? <input className="profile-input" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} /> : <div className="profile-field-value">{form.firstName || "—"}</div>}
                                    </div>
                                    <div className="profile-field">
                                        <label className="profile-field-label">Last Name</label>
                                        {editMode ? <input className="profile-input" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} /> : <div className="profile-field-value">{form.lastName || "—"}</div>}
                                    </div>
                                </div>
                                <div className="profile-field">
                                    <label className="profile-field-label">Email Address</label>
                                    <div className="profile-field-value locked">{form.email || user?.email || "—"}<span className="profile-lock-badge"><Lock size={12} style={{ marginRight: 4 }} /> Login</span></div>
                                </div>
                                <div className="profile-field">
                                    <label className="profile-field-label">Phone Number</label>
                                    {editMode ? <input className="profile-input" type="tel" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} /> : <div className="profile-field-value">{form.contactNumber || "—"}</div>}
                                </div>
                                <div className="profile-field">
                                    <label className="profile-field-label">Position / Role</label>
                                    <div className="profile-field-value locked">{user?.role || "OFFICIAL"}<span className="profile-lock-badge"><Lock size={12} style={{ marginRight: 4 }} /> Locked</span></div>
                                </div>
                                <div className="profile-field">
                                    <label className="profile-field-label">Bio</label>
                                    {editMode ? <textarea className="profile-input profile-textarea" value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} /> : <div className="profile-field-value profile-bio">{form.bio || "—"}</div>}
                                </div>
                                {editMode && <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving} type="button">{saving ? "Saving..." : "Save Changes ->"}</button>}
                                {saved && <div className="profile-saved-toast"><CheckCircle2 size={16} style={{ marginRight: 8 }} /> Profile updated successfully!</div>}
                            </div>
                        </div>

                        <div className="profile-card">
                            <div className="profile-card-header"><div className="profile-card-title"><Lock size={18} style={{ marginRight: 8 }} /> Privacy & Visibility</div></div>
                            <div className="profile-fields">
                                <div className="profile-field">
                                    <label className="profile-field-label">Directory Visibility</label>
                                    <select className="profile-input" value={form.profileVisibility} onChange={(e) => update("profileVisibility", e.target.value)}>
                                        <option value="PRIVATE">Private (Searchable by no one)</option>
                                        <option value="OFFICIALS">Officials Only (Searchable by other Officials)</option>
                                        <option value="RESIDENTS">All Residents (Searchable by everyone)</option>
                                    </select>
                                </div>
                                <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving} type="button">{saving ? "Saving..." : "Save Visibility"}</button>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card profile-card-full" style={{ marginTop: 16 }}>
                        <div className="profile-card-header">
                            <div className="profile-card-title"><Building2 size={18} style={{ marginRight: 8 }} /> Barangay Information</div>
                            <button className={`profile-edit-btn${editMode ? " cancel" : ""}`} onClick={() => setEditMode(!editMode)} type="button">
                                {editMode ? "Cancel" : <><Edit size={14} style={{ marginRight: 6 }} /> Edit</>}
                            </button>
                        </div>
                        <div className="profile-fields profile-fields-max">
                            <div className="profile-field-row">
                                <div className="profile-field">
                                    <label className="profile-field-label">Barangay Name</label>
                                    {editMode ? <input className="profile-input" value={form.barangay} onChange={(e) => update("barangay", e.target.value)} /> : <div className="profile-field-value">{form.barangay || "—"}</div>}
                                </div>
                                <div className="profile-field">
                                    <label className="profile-field-label">Municipality / City</label>
                                    {editMode ? <input className="profile-input" value={form.cityName} onChange={(e) => update("cityName", e.target.value)} /> : <div className="profile-field-value">{form.cityName || "—"}</div>}
                                </div>
                            </div>
                            <div className="profile-field-row">
                                <div className="profile-field">
                                    <label className="profile-field-label">Province / Region</label>
                                    <div className="profile-field-value">{form.provinceName || "—"} - {form.regionName || "—"}</div>
                                </div>
                                <div className="profile-field">
                                    <label className="profile-field-label">Specific Address</label>
                                    {editMode ? <input className="profile-input" value={form.address} onChange={(e) => update("address", e.target.value)} /> : <div className="profile-field-value">{form.address || "—"}</div>}
                                </div>
                            </div>
                            {editMode && <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving} type="button">{saving ? "Saving..." : "Save Barangay Info ->"}</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function DashboardOfficial({ user }) {
    const [showLogout, setShowLogout] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const [directoryCount, setDirectoryCount] = useState(0);
    const [evacuationCenters, setEvacuationCenters] = useState([]);
    const [resourceData, setResourceData] = useState(EMPTY_RESOURCE_DASHBOARD);
    const [resourcesLoading, setResourcesLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const active = new URLSearchParams(location.search).get("tab") || "overview";

    const fetchIncidents = async () => {
        try {
            const res = await getReports();
            setIncidents(res.data || []);
        } catch (err) {
            console.error("Fetch incidents error:", err);
        }
    };

    const fetchOverviewData = async () => {
        try {
            const [directoryRes, centers] = await Promise.all([getCommunityDirectory(), getEvacuationCenters()]);
            const residents = (directoryRes.data || []).filter((entry) => (entry.role || "").toUpperCase() === "RESIDENT");
            setDirectoryCount(residents.length);
            setEvacuationCenters(Array.isArray(centers) ? centers : []);
        } catch (err) {
            console.error("Fetch official overview data error:", err);
        }
    };

    const fetchResources = async () => {
        try {
            setResourcesLoading(true);
            const data = await getResourceDashboard();
            setResourceData({
                ...EMPTY_RESOURCE_DASHBOARD,
                ...data,
                summary: { ...EMPTY_RESOURCE_DASHBOARD.summary, ...(data?.summary || {}) },
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
        fetchOverviewData();
        fetchResources();
        const interval = setInterval(() => {
            fetchIncidents();
            fetchOverviewData();
            fetchResources();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
    };

    const screens = {
        overview: <Overview incidents={incidents} directoryCount={directoryCount} evacuationCenters={evacuationCenters} />,
        evacuation: <ManageEvacuationCenters />,
        directory: <ResidentDirectory />,
        announcements: <AnnouncementsPanel />,
        resources: <OfficialResources data={resourceData} isLoading={resourcesLoading} onRefresh={fetchResources} />,
        profile: <OfficialProfile user={user} />,
    };

    const titles = {
        overview: "Command Center Overview",
        evacuation: "Evacuation Centers",
        directory: "Resident Directory",
        announcements: "Manage Announcements",
        resources: "Resource Inventory",
        profile: "Profile",
    };

    useEffect(() => {
        if (!VALID_OFFICIAL_TABS.has(active)) {
            navigate("/dashboard?tab=overview", { replace: true });
        }
    }, [active, navigate]);

    return (
        <div className="dashboard-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
            <header className="rb-header" style={{ marginBottom: "20px", borderRadius: "12px" }}>
                <div className="rb-header-title">{titles[active]}</div>
                <div className="rb-header-actions">
                    <div className="rb-notif-bell">
                        <Bell size={20} />
                        <div className="rb-notif-count">{incidents.filter(i => i.status === "PENDING").length}</div>
                    </div>
                </div>
            </header>

            <div className="rb-content">
                {screens[active] || screens.overview}
            </div>

            <LogoutModal show={showLogout} onClose={() => setShowLogout(false)} onConfirm={handleLogout} />
        </div>
    );
}
