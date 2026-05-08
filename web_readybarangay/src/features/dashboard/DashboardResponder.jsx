import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
    Activity, Bell, Camera, CheckCircle2, Clock,
    Edit, Mail, MapPin, Navigation, Siren,
    User, Users
} from "lucide-react";
import "./DashboardResponder.css";
import "../profile/Profile.css";
import "../../global.css";
import { useAuth } from "../../shared/auth/AuthContext";
import {
    getAnnouncements,
    getReports,
    updateProfile,
    updateReportStatus,
    uploadProfilePicture,
} from "../../shared/api/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const VALID_RESPONDER_TABS = new Set(["missions", "map", "announcements", "profile"]);

const formatTime = (value) => value ? new Date(value).toLocaleString() : "N/A";
const statusClass = (status) => (status || "pending").toLowerCase();
const residentName = (incident) => `${incident.user?.firstName || "Resident"} ${incident.user?.lastName || ""}`.trim();
const DEFAULT_MAP_CENTER = [10.3157, 123.8854];

const MissionControl = ({ incidents, onRefresh }) => {
    const [savingId, setSavingId] = useState(null);
    const activeMissions = incidents.filter((i) => i.status !== "RESOLVED");
    const currentMission = activeMissions.find((i) => i.status === "RESPONDING") || activeMissions[0];
    const queuedMissions = incidents.filter((i) => i.status === "PENDING");
    const resolvedCount = incidents.filter((i) => i.status === "RESOLVED").length;

    const updateStatus = async (incident, status) => {
        try {
            setSavingId(incident.id);
            await updateReportStatus(incident.id, status);
            await onRefresh();
        } catch (err) {
            console.error("Responder status update failed:", err);
            alert("Failed to update mission status.");
        } finally {
            setSavingId(null);
        }
    };

    const openDirections = (incident) => {
        const destination = incident.latitude && incident.longitude
            ? `${incident.latitude},${incident.longitude}`
            : encodeURIComponent(incident.location || "");
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank");
    };

    return (
        <div className="responder-missions">
            <div className="rb-stat-grid" style={{ marginBottom: 20 }}>
                <div className="rb-stat-card">
                    <div className="rb-stat-icon green"><CheckCircle2 size={24} /></div>
                    <div className="rb-stat-label">Tasks Completed</div>
                    <div className="rb-stat-value">{resolvedCount}</div>
                    <div className="rb-stat-sub">Resolved reports</div>
                </div>
                <div className="rb-stat-card amber">
                    <div className="rb-stat-icon amber"><Activity size={24} /></div>
                    <div className="rb-stat-label">Active Missions</div>
                    <div className="rb-stat-value">{activeMissions.length}</div>
                    <div className="rb-stat-sub">{queuedMissions.length} pending dispatch</div>
                </div>
                <div className="rb-stat-card blue">
                    <div className="rb-stat-icon blue"><Users size={24} /></div>
                    <div className="rb-stat-label">Responder Status</div>
                    <div className="rb-stat-value">On Duty</div>
                    <div className="rb-stat-sub">Receiving assignments</div>
                </div>
            </div>

            <div className="rb-grid-sidebar">
                <div>
                    <div className="rb-section-header">
                        <div className="rb-section-title">Current Assignment</div>
                        <span className="rb-badge responding">{currentMission ? currentMission.status : "Clear"}</span>
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
                                        <div className="det-item"><span><User size={14} style={{ marginRight: 6 }} /> Resident:</span> {residentName(currentMission)}</div>
                                        <div className="det-item"><span><Siren size={14} style={{ marginRight: 6 }} /> Priority:</span> {currentMission.urgency || "Medium"}</div>
                                        <div className="det-item"><span><Clock size={14} style={{ marginRight: 6 }} /> Reported:</span> {formatTime(currentMission.createdAt)}</div>
                                    </div>
                                    <div className="rb-divider"></div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button className="rb-btn rb-btn-primary" style={{ flex: 1 }} onClick={() => openDirections(currentMission)}>
                                            <MapPin size={16} style={{ marginRight: 6 }} /> Directions
                                        </button>
                                        <button
                                            className="rb-btn rb-btn-secondary"
                                            style={{ flex: 1 }}
                                            disabled={savingId === currentMission.id}
                                            onClick={() => updateStatus(currentMission, "RESPONDING")}
                                        >
                                            <Navigation size={16} style={{ marginRight: 6 }} /> Mark Responding
                                        </button>
                                    </div>
                                    <button
                                        className="rb-btn rb-btn-primary rb-btn-lg"
                                        style={{ width: "100%", marginTop: 12, background: "var(--green-600)" }}
                                        disabled={savingId === currentMission.id}
                                        onClick={() => updateStatus(currentMission, "RESOLVED")}
                                    >
                                        <CheckCircle2 size={20} style={{ marginRight: 8 }} /> Mark as Resolved
                                    </button>
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
                                <thead><tr><th>Type</th><th>Location</th><th>Priority</th><th>Time</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
                                <tbody>
                                    {queuedMissions.length === 0 ? (
                                        <tr><td colSpan="5" style={{ padding: 18, color: "var(--gray-500)" }}>No queued missions.</td></tr>
                                    ) : queuedMissions.map(i => (
                                        <tr key={i.id}>
                                            <td>{i.incidentType}</td>
                                            <td>{i.location}</td>
                                            <td><span className={`rb-badge ${i.urgency?.toLowerCase() || "medium"}`}>{i.urgency || "Medium"}</span></td>
                                            <td>{formatTime(i.createdAt)}</td>
                                            <td style={{ textAlign: "right" }}>
                                                <button className="rb-btn rb-btn-secondary rb-btn-sm" disabled={savingId === i.id} onClick={() => updateStatus(i, "RESPONDING")}>Accept</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="rb-card">
                        <div className="rb-card-header"><div className="rb-card-title">Responder Status</div></div>
                        <div className="rb-card-body">
                            <div className="responder-status-grid">
                                <button className="status-opt active green">On Duty</button>
                                <button className="status-opt amber">On Break</button>
                                <button className="status-opt">Off Duty</button>
                            </div>
                            <div className="rb-divider"></div>
                            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                                Status controls are local for now; mission actions update reports in the system.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MapBounds = ({ locations }) => {
    const map = useMap();

    useEffect(() => {
        if (locations.length === 0) return;
        const bounds = L.latLngBounds(locations.map((incident) => [incident.latitude, incident.longitude]));
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
    }, [locations, map]);

    return null;
};

const ResponseMap = ({ incidents }) => {
    const mapped = incidents.filter((incident) => incident.status !== "RESOLVED");
    const mappedWithCoordinates = mapped.filter((incident) => Number.isFinite(Number(incident.latitude)) && Number.isFinite(Number(incident.longitude)));
    const mapCenter = mappedWithCoordinates.length > 0
        ? [mappedWithCoordinates[0].latitude, mappedWithCoordinates[0].longitude]
        : DEFAULT_MAP_CENTER;

    const openDirections = (incident) => {
        const destination = incident.latitude && incident.longitude
            ? `${incident.latitude},${incident.longitude}`
            : encodeURIComponent(incident.location || "");
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank");
    };

    return (
        <div className="responder-map">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Response Map</div>
                    <div className="rb-section-sub">Open mission locations and directions</div>
                </div>
            </div>
            <div className="rb-card">
                <div className="responder-live-map">
                    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapBounds locations={mappedWithCoordinates} />
                        {mappedWithCoordinates.map((incident) => (
                            <Marker key={incident.id} position={[incident.latitude, incident.longitude]}>
                                <Popup>
                                    <strong>INC-{incident.id}</strong><br />
                                    {incident.incidentType || "Emergency Report"}<br />
                                    {incident.location}<br />
                                    Priority: {incident.urgency || "Medium"}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                    {mappedWithCoordinates.length === 0 && (
                        <div className="responder-map-empty">
                            <MapPin size={24} style={{ marginRight: 8 }} /> No active reports with pinned coordinates.
                        </div>
                    )}
                </div>
                <div className="rb-table-wrap">
                    <table className="rb-table">
                        <thead><tr><th>Mission</th><th>Location</th><th>Priority</th><th>Status</th><th style={{ textAlign: "right" }}>Directions</th></tr></thead>
                        <tbody>
                            {mapped.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: 18, color: "var(--gray-500)" }}>No active locations.</td></tr>
                            ) : mapped.map((incident) => (
                                <tr key={incident.id}>
                                    <td><strong>INC-{incident.id}</strong><div style={{ fontSize: 11, color: "var(--gray-400)" }}>{incident.incidentType}</div></td>
                                    <td>{incident.location}</td>
                                    <td><span className={`rb-badge ${incident.urgency?.toLowerCase() || "medium"}`}>{incident.urgency || "Medium"}</span></td>
                                    <td><span className={`rb-badge ${statusClass(incident.status)}`}>{incident.status}</span></td>
                                    <td style={{ textAlign: "right" }}>
                                        <button className="rb-btn rb-btn-primary rb-btn-sm" onClick={() => openDirections(incident)}>
                                            <Navigation size={13} style={{ marginRight: 4 }} /> Open
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnnouncements()
            .then((data) => setAnnouncements(data || []))
            .catch((err) => console.error("Fetch announcements error:", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="responder-announcements">
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Announcements</div>
                    <div className="rb-section-sub">Dispatches, advisories, and barangay notices</div>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {loading ? (
                    <div className="rb-card"><div className="rb-card-body">Loading announcements...</div></div>
                ) : announcements.length === 0 ? (
                    <div className="rb-card"><div className="rb-card-body" style={{ color: "var(--gray-500)" }}>No announcements posted yet.</div></div>
                ) : announcements.map((a) => (
                    <div key={a.id} className={`rb-announcement${a.emergency ? " emergency-alert" : ""}`}>
                        <div className="rb-announcement-title">
                            {a.emergency && <Siren size={15} style={{ marginRight: 6, display: "inline", verticalAlign: "middle" }} />}
                            {a.title}
                        </div>
                        <div className="rb-announcement-body">{a.body}</div>
                        <div className="rb-announcement-meta">
                            {a.emergency && <span className="rb-badge emergency">Emergency</span>}
                            <span>{a.category || "General"}</span>
                            <span><Clock size={11} style={{ marginRight: 3 }} />{formatTime(a.createdAt)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ResponderProfile = ({ user }) => {
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
        barangay: user?.barangay || "",
        address: user?.address || "",
        bio: user?.bio || "Ready to respond.",
        profileVisibility: user?.profileVisibility || "OFFICIALS",
    });

    const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.trim() || user?.email?.[0]?.toUpperCase() || "R";
    const profileImageUrl = user?.profilePictureUrl
        ? (user.profilePictureUrl.startsWith("http") ? user.profilePictureUrl : `http://localhost:8080${user.profilePictureUrl}`)
        : null;
    const fullName = `${form.firstName || user?.firstName || ""} ${form.lastName || user?.lastName || ""}`.trim() || "Responder";
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
            console.error("Responder profile update failed:", err);
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
            console.error("Responder profile picture upload failed:", err);
            alert("Failed to upload profile picture.");
        } finally {
            setAvatarUploading(false);
            event.target.value = "";
        }
    };

    return (
        <div className="profile-container responder-profile" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            <div className="page-body">
                <div className="profile-banner">
                    <div className="profile-banner-bg-orb" />
                    <div className="profile-banner-bg-ring" />
                    <div className="profile-banner-left">
                        <div className="profile-avatar-wrap">
                            <div className="profile-avatar">{profileImageUrl ? <img src={profileImageUrl} alt="Profile" className="profile-avatar-img" /> : initials}</div>
                            <button className="profile-avatar-edit" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading} type="button"><Camera size={16} /></button>
                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                        </div>
                        <div className="profile-banner-info">
                            <div className="profile-role-chip"><span className="profile-role-dot" /> Emergency Responder</div>
                            <h1 className="profile-name">{fullName}</h1>
                            <div className="profile-meta-row">
                                <span className="profile-meta-item"><MapPin size={14} style={{ marginRight: 6 }} /> {form.barangay || "No Barangay assigned"}</span>
                                <span className="profile-meta-sep">·</span>
                                <span className="profile-meta-item"><Mail size={14} style={{ marginRight: 6 }} /> {form.email || user?.email}</span>
                            </div>
                        </div>
                    </div>
                    <div className="profile-banner-right">
                        <div className="profile-banner-stat"><div className="profile-banner-stat-num">On</div><div className="profile-banner-stat-label">Duty Status</div></div>
                        <div className="profile-banner-stat-div" />
                        <div className="profile-banner-stat"><div className="profile-banner-stat-num">Field</div><div className="profile-banner-stat-label">Responder</div></div>
                    </div>
                </div>

                <div className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-card-title"><User size={18} style={{ marginRight: 8 }} /> Field Profile</div>
                        <button className={`profile-edit-btn${editMode ? " cancel" : ""}`} onClick={() => setEditMode(!editMode)} type="button">
                            {editMode ? "Cancel" : <><Edit size={14} style={{ marginRight: 6 }} /> Edit</>}
                        </button>
                    </div>
                    <div className="profile-fields profile-fields-max">
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
                        <div className="profile-field-row">
                            <div className="profile-field">
                                <label className="profile-field-label">Phone Number</label>
                                {editMode ? <input className="profile-input" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} /> : <div className="profile-field-value">{form.contactNumber || "—"}</div>}
                            </div>
                            <div className="profile-field">
                                <label className="profile-field-label">Role</label>
                                <div className="profile-field-value locked">{user?.role || "RESPONDER"}</div>
                            </div>
                        </div>
                        <div className="profile-field">
                            <label className="profile-field-label">Bio</label>
                            {editMode ? <textarea className="profile-input profile-textarea" value={form.bio} onChange={(e) => update("bio", e.target.value)} /> : <div className="profile-field-value profile-bio">{form.bio || "—"}</div>}
                        </div>
                        {editMode && <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving} type="button">{saving ? "Saving..." : "Save Changes ->"}</button>}
                        {saved && <div className="profile-saved-toast"><CheckCircle2 size={16} style={{ marginRight: 8 }} /> Profile updated successfully!</div>}
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

    const fetchIncidents = async () => {
        try {
            const res = await getReports();
            setIncidents(res.data || []);
        } catch (err) {
            console.error("Fetch incidents error:", err);
        }
    };

    useEffect(() => {
        fetchIncidents();
        const interval = setInterval(fetchIncidents, 30000);
        return () => clearInterval(interval);
    }, []);

    const screens = {
        missions: <MissionControl incidents={incidents} onRefresh={fetchIncidents} />,
        map: <ResponseMap incidents={incidents} />,
        announcements: <Announcements />,
        profile: <ResponderProfile user={user} />,
    };

    const titles = {
        missions: "Mission Control",
        map: "Response Map",
        announcements: "Dispatches & Alerts",
        profile: "Field Profile",
    };

    useEffect(() => {
        if (!VALID_RESPONDER_TABS.has(active)) {
            navigate("/dashboard?tab=missions", { replace: true });
        }
    }, [active, navigate]);

    return (
        <div className="dashboard-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
            <header className="rb-header" style={{ marginBottom: "20px", borderRadius: "12px" }}>
                <div className="rb-header-title">{titles[active]}</div>
                <div className="rb-header-actions">
                    <span className="responder-badge">ON DUTY</span>
                    <div className="rb-notif-bell">
                        <Bell size={20} />
                        <div className="rb-notif-count">{incidents.filter(i => i.status === "PENDING").length}</div>
                    </div>
                </div>
            </header>

            <div className="rb-content">
                {screens[active] || screens.missions}
            </div>
        </div>
    );
}
