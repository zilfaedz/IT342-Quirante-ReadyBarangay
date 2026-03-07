import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard, AlertTriangle, Megaphone, Map, ShieldAlert,
    Users, ClipboardList, LineChart, Settings, User,
    CheckCircle2, Shield, Bell, Camera, MapPin, Mail,
    Calendar, ArrowLeft, Lock, Smartphone, LogOut, ChevronRight,
    Edit, Building2, Hospital
} from "lucide-react";
import "./DashboardLayout.css";
import "./Profile.css";
import { useAuth } from "../context/AuthContext";
import { getBarangayStats, updateProfile, uploadProfilePicture } from "../services/api";
import PhilippineLocationSelector from "../components/PhilippineLocationSelector";

const navItems = [
    {
        section: null, items: [
            { icon: <LayoutDashboard size={18} />, label: "Dashboard", path: "/dashboard", badge: null },
        ]
    },
    {
        section: "Emergency", items: [
            { icon: <AlertTriangle size={18} />, label: "Incidents", path: "/incidents", badge: "3" },
            { icon: <Megaphone size={18} />, label: "Alerts", path: "/alerts", badge: null },
            { icon: <Map size={18} />, label: "Evacuation Map", path: "/evacuation", badge: null },
            { icon: <ShieldAlert size={18} />, label: "Responders", path: "/responders", badge: null },
        ]
    },
    {
        section: "Community", items: [
            { icon: <Users size={18} />, label: "Residents", path: "/residents", badge: null },
            { icon: <ClipboardList size={18} />, label: "Reports", path: "/reports", badge: null },
            { icon: <LineChart size={18} />, label: "Analytics", path: "/analytics", badge: null },
        ]
    },
    {
        section: "System", items: [
            { icon: <Settings size={18} />, label: "Settings", path: "/settings", badge: null },
            { icon: <User size={18} />, label: "Profile", path: "/profile", badge: null },
        ]
    },
];

const activityLog = [
    { icon: <AlertTriangle size={14} />, action: "Declared Yellow Alert", detail: "Alert level raised to Yellow due to heavy rainfall forecast.", time: "Today, 2:30 PM" },
    { icon: <Megaphone size={14} />, action: "Sent Community Broadcast", detail: "Advised residents near creek to prepare for possible flooding.", time: "Today, 1:15 PM" },
    { icon: <CheckCircle2 size={14} />, action: "Resolved Incident INC-003", detail: "Medical emergency at Barangay Hall Area resolved.", time: "Today, 11:40 AM" },
    { icon: <ShieldAlert size={14} />, action: "Dispatched Responders", detail: "6 tanod deployed to Sitio Bagong Pag-asa fire site.", time: "Yesterday, 8:22 PM" },
    { icon: <ClipboardList size={14} />, action: "Approved Incident Report", detail: "INC-002 fire report verified and logged.", time: "Yesterday, 8:05 PM" },
];

const profileTabs = ["Overview", "Security", "Notifications", "Barangay Info"];

// Local Sidebar removed because it's now provided by the global Layout.jsx

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [activePath] = useState("/profile");
    const [activeTab, setActiveTab] = useState("Overview");
    const [editMode, setEditMode] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [barangayStats, setBarangayStats] = useState({
        totalResidents: 0,
        officialsRegistered: 0,
        evacuationCenters: 0,
        totalIncidentsLogged: 0,
    });
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        contactNumber: user?.contactNumber || "",
        position: user?.role || "Resident",
        barangay: user?.barangay || "",
        barangayCode: user?.barangayCode || "",
        regionName: user?.regionName || user?.region || "",
        regionCode: user?.regionCode || "",
        cityName: user?.cityName || user?.city || "",
        cityCode: user?.cityCode || "",
        provinceName: user?.provinceName || user?.province || "",
        provinceCode: user?.provinceCode || "",
        address: user?.address || "",
        bio: user?.bio || "Serving the community.",
        profileVisibility: user?.profileVisibility || "OFFICIALS",
    });

    const [notifs, setNotifs] = useState({
        incidentAlerts: true,
        weatherAdvisories: true,
        evacuationUpdates: true,
        residentReports: true,
        systemUpdates: false,
        emailDigest: true,
    });

    const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.trim()
        || user?.email?.[0]?.toUpperCase()
        || "U";

    const profileImageUrl = user?.profilePictureUrl
        ? (user.profilePictureUrl.startsWith("http") ? user.profilePictureUrl : `http://localhost:8080${user.profilePictureUrl}`)
        : null;

    const handleSave = async () => {
        try {
            await updateProfile(form);
            updateUser(form);
            setSaved(true);
            setEditMode(false);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile. Please try again.");
        }
    };

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleLocationChange = (loc) => {
        setForm(f => ({
            ...f,
            regionName: loc.region?.name || "",
            regionCode: loc.region?.code || "",
            provinceName: loc.province?.name || "",
            provinceCode: loc.province?.code || "",
            cityName: loc.city?.name || "",
            cityCode: loc.city?.code || "",
            barangay: loc.barangay?.name || "",
            barangayCode: loc.barangay?.code || "",
        }));
    };

    const fetchStats = useCallback(async () => {
        try {
            const response = await getBarangayStats();
            setBarangayStats({
                totalResidents: response.data?.totalResidents || 0,
                officialsRegistered: response.data?.officialsRegistered || 0,
                evacuationCenters: response.data?.evacuationCenters || 0,
                totalIncidentsLogged: response.data?.totalIncidentsLogged || 0,
            });
        } catch (error) {
            console.error("Failed to fetch barangay stats", error);
        }
    }, []);

    useEffect(() => {
        if (activeTab !== "Barangay Info") return;

        fetchStats();
        const intervalId = setInterval(fetchStats, 10000);
        return () => clearInterval(intervalId);
    }, [activeTab, fetchStats]);

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
        } catch (error) {
            console.error("Failed to upload profile picture", error);
            alert("Failed to upload profile picture. Please try again.");
        } finally {
            setAvatarUploading(false);
            event.target.value = "";
        }
    };

    return (
        <div className="profile-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Topbar */}
            <div className="topbar">
                <div className="topbar-left">
                    <span className="topbar-page-title">My Profile</span>
                    <span className="topbar-breadcrumb">Account Settings & Information</span>
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

                {/* Profile banner */}
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
                                {user?.role || "Resident"}
                            </div>
                            <h1 className="profile-name">{user?.firstName} {user?.lastName}</h1>
                            <div className="profile-meta-row">
                                <span className="profile-meta-item"><MapPin size={14} style={{ marginRight: 6 }} /> {user?.barangay || "No Barangay assigned"}</span>
                                <span className="profile-meta-sep">·</span>
                                <span className="profile-meta-item"><Mail size={14} style={{ marginRight: 6 }} /> {user?.email}</span>
                                <span className="profile-meta-sep">·</span>
                                <span className="profile-meta-item"><Calendar size={14} style={{ marginRight: 6 }} /> Member since Jan 2022</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-banner-right">
                        <div className="profile-banner-stat">
                            <div className="profile-banner-stat-num">47</div>
                            <div className="profile-banner-stat-label">Incidents Handled</div>
                        </div>
                        <div className="profile-banner-stat-div" />
                        <div className="profile-banner-stat">
                            <div className="profile-banner-stat-num">230</div>
                            <div className="profile-banner-stat-label">Alerts Sent</div>
                        </div>
                        <div className="profile-banner-stat-div" />
                        <div className="profile-banner-stat">
                            <div className="profile-banner-stat-num">1,284</div>
                            <div className="profile-banner-stat-label">Residents Served</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    {profileTabs.map((tab) => (
                        <button
                            key={tab}
                            className={`profile-tab${activeTab === tab ? " active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── TAB: Overview ── */}
                {activeTab === "Overview" && (
                    <div className="profile-tab-content">
                        <div className="profile-two-col">

                            {/* Personal info */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="profile-card-title"><User size={18} style={{ marginRight: 8 }} /> Personal Information</div>
                                    <button
                                        className={`profile-edit-btn${editMode ? " cancel" : ""}`}
                                        onClick={() => setEditMode(!editMode)}
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
                                                <div className="profile-field-value">{form.firstName}</div>
                                            )}
                                        </div>
                                        <div className="profile-field">
                                            <label className="profile-field-label">Last Name</label>
                                            {editMode ? (
                                                <input className="profile-input" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
                                            ) : (
                                                <div className="profile-field-value">{form.lastName}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-field-label">Email Address</label>
                                        {editMode ? (
                                            <input className="profile-input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                                        ) : (
                                            <div className="profile-field-value">{form.email}</div>
                                        )}
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-field-label">Phone Number</label>
                                        {editMode ? (
                                            <input className="profile-input" type="tel" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} />
                                        ) : (
                                            <div className="profile-field-value">{form.contactNumber}</div>
                                        )}
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-field-label">Position / Role</label>
                                        <div className="profile-field-value locked">
                                            {form.position}
                                            <span className="profile-lock-badge"><Lock size={12} style={{ marginRight: 4 }} /> Locked</span>
                                        </div>
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-field-label">Directory Visibility</label>
                                        {editMode ? (
                                            <select
                                                className="profile-input"
                                                value={form.profileVisibility}
                                                onChange={(e) => update("profileVisibility", e.target.value)}
                                            >
                                                <option value="PRIVATE">Private (Searchable by no one)</option>
                                                <option value="OFFICIALS">Officials Only (Searchable by Barangay Officials)</option>
                                                <option value="RESIDENTS">All Residents (Searchable by Neighbors)</option>
                                            </select>
                                        ) : (
                                            <div className="profile-field-value">
                                                {form.profileVisibility === "PRIVATE" && "Private"}
                                                {form.profileVisibility === "OFFICIALS" && "Officials Only"}
                                                {form.profileVisibility === "RESIDENTS" && "All Residents"}
                                            </div>
                                        )}
                                        <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                                            Controls who can see you in the Community Directory.
                                        </p>
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
                                            <div className="profile-field-value profile-bio">{form.bio}</div>
                                        )}
                                    </div>

                                    {editMode && (
                                        <button className="profile-save-btn" onClick={handleSave}>
                                            Save Changes →
                                        </button>
                                    )}

                                    {saved && (
                                        <div className="profile-saved-toast"><CheckCircle2 size={16} style={{ marginRight: 8 }} /> Profile updated successfully!</div>
                                    )}
                                </div>
                            </div>

                            {/* Activity log */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="profile-card-title"><ClipboardList size={18} style={{ marginRight: 8 }} /> Recent Activity</div>
                                    <button className="profile-edit-btn">View All</button>
                                </div>
                                <div className="profile-activity-list">
                                    {activityLog.map((log, i) => (
                                        <div key={i} className="profile-activity-row">
                                            <div className="profile-activity-icon">{log.icon}</div>
                                            <div className="profile-activity-body">
                                                <div className="profile-activity-action">{log.action}</div>
                                                <div className="profile-activity-detail">{log.detail}</div>
                                                <div className="profile-activity-time">{log.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* ── TAB: Security ── */}
                {activeTab === "Security" && (
                    <div className="profile-tab-content">
                        <div className="profile-card profile-card-full">
                            <div className="profile-card-header">
                                <div className="profile-card-title"><Lock size={18} style={{ marginRight: 8 }} /> Security Settings</div>
                            </div>
                            <div className="profile-fields profile-fields-max">

                                <div className="profile-security-section">
                                    <div className="profile-security-title">Change Password</div>
                                    <div className="profile-field-row">
                                        <div className="profile-field">
                                            <label className="profile-field-label">Current Password</label>
                                            <input className="profile-input" type="password" placeholder="Enter current password" />
                                        </div>
                                    </div>
                                    <div className="profile-field-row">
                                        <div className="profile-field">
                                            <label className="profile-field-label">New Password</label>
                                            <input className="profile-input" type="password" placeholder="Enter new password" />
                                        </div>
                                        <div className="profile-field">
                                            <label className="profile-field-label">Confirm New Password</label>
                                            <input className="profile-input" type="password" placeholder="Repeat new password" />
                                        </div>
                                    </div>
                                    <button className="profile-save-btn">Update Password →</button>
                                </div>

                                <div className="profile-security-divider" />

                                <div className="profile-security-section">
                                    <div className="profile-security-title">Login Sessions</div>
                                    <p className="profile-security-desc">You are currently logged in on 1 device.</p>
                                    {[
                                        { device: "Chrome on Windows", location: "Quezon City, PH", time: "Current session", current: true },
                                        { device: "Mobile App (Android)", location: "Quezon City, PH", time: "2 days ago", current: false },
                                    ].map((s, i) => (
                                        <div key={i} className="profile-session-row">
                                            <div className="profile-session-icon">{s.current ? <Lock size={18} /> : <Smartphone size={18} />}</div>
                                            <div className="profile-session-info">
                                                <div className="profile-session-device">{s.device}</div>
                                                <div className="profile-session-meta">{s.location} · {s.time}</div>
                                            </div>
                                            {s.current
                                                ? <span className="profile-session-current">Active</span>
                                                : <button className="profile-session-revoke">Revoke</button>
                                            }
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>

                        <div className="profile-danger-zone">
                            <div className="profile-danger-title"><AlertTriangle size={18} style={{ marginRight: 8 }} /> Danger Zone</div>
                            <div className="profile-danger-row">
                                <div>
                                    <div className="profile-danger-action-label">Deactivate Account</div>
                                    <div className="profile-danger-action-sub">Temporarily disable your ReadyBarangay account.</div>
                                </div>
                                <button className="profile-danger-btn outline">Deactivate</button>
                            </div>
                            <div className="profile-danger-row">
                                <div>
                                    <div className="profile-danger-action-label">Log Out of All Devices</div>
                                    <div className="profile-danger-action-sub">Sign out from all active sessions immediately.</div>
                                </div>
                                <button className="profile-danger-btn solid">Log Out All</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: Notifications ── */}
                {activeTab === "Notifications" && (
                    <div className="profile-tab-content">
                        <div className="profile-card profile-card-full">
                            <div className="profile-card-header">
                                <div className="profile-card-title"><Bell size={18} style={{ marginRight: 8 }} /> Notification Preferences</div>
                            </div>
                            <div className="profile-fields profile-fields-max profile-fields-brgy">
                                <p className="profile-notif-desc">
                                    Choose which notifications you'd like to receive. Emergency alerts are always on.
                                </p>
                                {Object.entries(notifs).map(([key, val]) => {
                                    const labels = {
                                        incidentAlerts: { label: "Incident Alerts", sub: "Notify when new incidents are filed or updated", locked: true },
                                        weatherAdvisories: { label: "Weather Advisories", sub: "PAGASA alerts and severe weather warnings", locked: false },
                                        evacuationUpdates: { label: "Evacuation Center Updates", sub: "Capacity changes and center status", locked: false },
                                        residentReports: { label: "Resident Reports", sub: "When residents submit new reports", locked: false },
                                        systemUpdates: { label: "System Updates", sub: "Platform updates and maintenance notices", locked: false },
                                        emailDigest: { label: "Weekly Email Digest", sub: "Weekly summary of barangay activity", locked: false },
                                    };
                                    const info = labels[key];
                                    return (
                                        <div key={key} className="profile-notif-row">
                                            <div className="profile-notif-info">
                                                <div className="profile-notif-label">{info.label}</div>
                                                <div className="profile-notif-sub">{info.sub}</div>
                                            </div>
                                            <div className={`profile-toggle${val ? " on" : ""}${info.locked ? " locked" : ""}`}
                                                onClick={() => !info.locked && setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                                            >
                                                <div className="profile-toggle-thumb" />
                                            </div>
                                        </div>
                                    );
                                })}
                                <button className="profile-save-btn" style={{ marginTop: 8 }}>Save Preferences →</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: Barangay Info ── */}
                {activeTab === "Barangay Info" && (
                    <div className="profile-tab-content">
                        <div className="profile-card profile-card-full">
                            <div className="profile-card-header">
                                <div className="profile-card-title"><Building2 size={18} style={{ marginRight: 8 }} /> Barangay Information</div>
                                <button
                                    className={`profile-edit-btn${editMode ? " cancel" : ""}`}
                                    onClick={() => setEditMode(!editMode)}
                                >
                                    {editMode ? "Cancel" : <><Edit size={14} style={{ marginRight: 6 }} /> Edit</>}
                                </button>
                            </div>
                            <div className="profile-fields profile-fields-max">
                                {editMode ? (
                                    <>
                                        <div style={{ marginBottom: "20px" }}>
                                            <PhilippineLocationSelector onLocationChange={handleLocationChange} />
                                        </div>
                                        <div className="profile-field">
                                            <label className="profile-field-label">Specific Address (House No, Street)</label>
                                            <input className="profile-input" value={form.address || ""} onChange={e => update("address", e.target.value)} />
                                        </div>
                                        <button className="profile-save-btn" onClick={handleSave} style={{ marginTop: "15px" }}>
                                            Save Location →
                                        </button>
                                        {saved && (
                                            <div className="profile-saved-toast" style={{ marginTop: "10px" }}><CheckCircle2 size={16} style={{ marginRight: 8 }} /> Location updated successfully!</div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="profile-field-row">
                                            <div className="profile-field">
                                                <label className="profile-field-label">Barangay Name</label>
                                                <div className="profile-field-value">{user?.barangay || "—"}</div>
                                            </div>
                                            <div className="profile-field">
                                                <label className="profile-field-label">Municipality / City</label>
                                                <div className="profile-field-value">{user?.cityName || user?.city || "—"}</div>
                                            </div>
                                        </div>
                                        <div className="profile-field-row">
                                            <div className="profile-field">
                                                <label className="profile-field-label">Province / Region</label>
                                                <div className="profile-field-value">
                                                    {user?.provinceName || user?.province || "—"} - {user?.regionName || user?.region || "—"}
                                                </div>
                                            </div>
                                            <div className="profile-field">
                                                <label className="profile-field-label">Specific Address</label>
                                                <div className="profile-field-value">{user?.address || "—"}</div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="profile-brgy-stats">
                                    {[
                                        { icon: <Users size={18} />, label: "Total Residents", value: barangayStats.totalResidents },
                                        { icon: <ShieldAlert size={18} />, label: "Officials Registered", value: barangayStats.officialsRegistered },
                                        { icon: <Hospital size={18} />, label: "Evacuation Centers", value: barangayStats.evacuationCenters },
                                        { icon: <ClipboardList size={18} />, label: "Total Incidents Logged", value: barangayStats.totalIncidentsLogged },
                                    ].map((s, i) => (
                                        <div key={i} className="profile-brgy-stat">
                                            <div className="profile-brgy-stat-icon">{s.icon}</div>
                                            <div className="profile-brgy-stat-value">{Number(s.value || 0).toLocaleString()}</div>
                                            <div className="profile-brgy-stat-label">{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
