import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import api from "../../shared/api/api";
import "../dashboard/DashboardOfficial.css";
import "./AdminDashboard.css";
import { Activity, Bell, RefreshCcw, ShieldCheck, Users } from "lucide-react";
import AdminTransfersScreen from "./AdminTransfersScreen";

const TITLES = {
  dashboard: {
    title: "Dashboard",
    subtitle: "System overview, recent activity, and quick statistics"
  },
  analytics: {
    title: "Analytics",
    subtitle: "Emergency trends, barangay activity, and usage statistics"
  },
  "audit-logs": {
    title: "Audit Logs",
    subtitle: "Admin actions and security monitoring"
  },
  barangays: {
    title: "Barangays",
    subtitle: "View all barangays, activate/deactivate, and assigned captains"
  },
  "captain-verifications": {
    title: "Captain Verifications",
    subtitle: "Approve newly registered captains and validate submitted documents"
  },
  "captain-transfers": {
    title: "Captain Transfers",
    subtitle: "Election turnover requests and ownership transfer approvals"
  },
  "officials-verification": {
    title: "Officials Verification",
    subtitle: "Approve barangay officials appointed by captains"
  },
  users: {
    title: "Users",
    subtitle: "Residents, officials, captains, and account management"
  },
  "emergency-reports": {
    title: "Emergency Reports",
    subtitle: "Monitor incidents nationwide and flag false reports"
  },
  "evacuation-centers": {
    title: "Evacuation Centers",
    subtitle: "Review evacuation center listings and remove incorrect entries"
  },
  announcements: {
    title: "Announcements",
    subtitle: "Send alerts to all barangays or specific areas"
  },
  "system-settings": {
    title: "System Settings",
    subtitle: "API integrations, notification controls, and feature toggles"
  },
  "system-logs": {
    title: "System Logs",
    subtitle: "Backend/system events and error monitoring"
  },
  "admin-management": {
    title: "Admin Management",
    subtitle: "Add and remove admin accounts"
  }
};

const Section = ({ children }) => <div className="admin-module-card">{children}</div>;

function Overview({ overview, setActive }) {
  return (
    <div>
      <div className="admin-overview-alert">ADMIN MONITORING: real-time system status and oversight</div>

      <div className="admin-overview-actions">
        <button className="admin-overview-action" onClick={() => setActive("captain-verifications")}>
          <ShieldCheck size={20} />
          <div>
            <div className="admin-overview-action-title">Review Captain Verifications</div>
            <div className="admin-overview-action-sub">Approve or reject pending captain applications</div>
          </div>
        </button>
        <button className="admin-overview-action" onClick={() => setActive("captain-transfers")}>
          <RefreshCcw size={20} />
          <div>
            <div className="admin-overview-action-title">Review Captain Transfers</div>
            <div className="admin-overview-action-sub">Process leadership turnover requests</div>
          </div>
        </button>
      </div>

      <div className="admin-overview-stats">
        <div className="admin-overview-stat-card"><div className="admin-overview-stat-label">Total Registered Barangays</div><div className="admin-overview-stat-value">{overview.totalRegisteredBarangays}</div></div>
        <div className="admin-overview-stat-card"><div className="admin-overview-stat-label">Pending Barangay Verifications</div><div className="admin-overview-stat-value">{overview.pendingBarangayVerifications}</div></div>
        <div className="admin-overview-stat-card"><div className="admin-overview-stat-label">Pending Captain Transfers</div><div className="admin-overview-stat-value">{overview.pendingCaptainTransfers}</div></div>
        <div className="admin-overview-stat-card"><div className="admin-overview-stat-label">Total Users</div><div className="admin-overview-stat-value">{overview.totalUsers}</div></div>
        <div className="admin-overview-stat-card"><div className="admin-overview-stat-label">Active Emergency Reports</div><div className="admin-overview-stat-value">{overview.activeEmergencyReports}</div></div>
      </div>

      <div className="admin-overview-widgets">
        <div className="admin-overview-widget">
          <div className="admin-overview-widget-title"><Bell size={14} /> Recent Activity</div>
          <div className="admin-overview-list">
            {overview.recentActivity.map((x, i) => <div className="admin-overview-list-item" key={i}><span>{x.label}</span><small>{x.time}</small></div>)}
          </div>
        </div>
        <div className="admin-overview-widget">
          <div className="admin-overview-widget-title"><Users size={14} /> New Registrations</div>
          <div className="admin-overview-list">
            {overview.newRegistrations.map((x) => <div className="admin-overview-list-item" key={x.id}><span>{x.name}</span><small>{x.status}</small></div>)}
          </div>
        </div>
        <div className="admin-overview-widget">
          <div className="admin-overview-widget-title"><Activity size={14} /> Recent Reports</div>
          <div className="admin-overview-list">
            {overview.recentReports.map((x) => <div className="admin-overview-list-item" key={x.id}><span>{x.type}</span><small>{x.status}</small></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

const SimpleTable = ({ columns, rows }) => (
  <div className="admin-content-section">
    <table className="admin-table">
      <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.length
          ? rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)
          : <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: 24 }}>No records found</td></tr>}
      </tbody>
    </table>
  </div>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const active = new URLSearchParams(location.search).get("tab") || "dashboard";

  const [applications, setApplications] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [centers, setCenters] = useState([]);
  const [approveLoadingId, setApproveLoadingId] = useState(null);
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [overview, setOverview] = useState({
    totalRegisteredBarangays: 0,
    pendingBarangayVerifications: 0,
    pendingCaptainTransfers: 0,
    totalUsers: 0,
    activeEmergencyReports: 0,
    newRegistrations: [],
    recentReports: [],
    recentActivity: []
  });

  const setActive = (tab) => navigate(`/admin/verifications?tab=${tab}`);

  useEffect(() => {
    if (!user || (user.role !== "OFFICIAL" && user.role !== "Super Admin")) {
      navigate("/dashboard");
      return;
    }

    (async () => {
      try {
        const [statsRes, appsRes, transfersRes, reportsRes, usersRes, centersRes] = await Promise.all([
          api.get("/admin/verifications/stats"),
          api.get("/admin/verifications"),
          api.get("/admin/transfers"),
          api.get("/reports"),
          api.get("/user/all"),
          api.get("/evacuation-centers")
        ]);

        const a = appsRes.data || [];
        const t = transfersRes.data || [];
        const r = reportsRes.data || [];
        const u = usersRes.data || [];

        setApplications(a);
        setTransfers(t);
        setReports(r);
        setUsers(u);
        setCenters(centersRes.data || []);

        setOverview({
          totalRegisteredBarangays: statsRes.data?.registeredBarangays || 0,
          pendingBarangayVerifications: statsRes.data?.pending || 0,
          pendingCaptainTransfers: t.length,
          totalUsers: u.length,
          activeEmergencyReports: r.filter((x) => (x.status || "").toUpperCase() !== "RESOLVED").length,
          newRegistrations: a.slice(0, 5).map((x) => ({ id: x.id, name: x.fullName || "Unknown", status: x.accountStatus || "PENDING" })),
          recentReports: r.slice(0, 5).map((x) => ({ id: x.id, type: x.incidentType || "Incident", status: x.status || "PENDING" })),
          recentActivity: [
            ...a.slice(0, 3).map((x) => ({ label: `Captain application: ${x.fullName || "Unknown"}`, time: x.accountStatus || "Pending" })),
            ...r.slice(0, 2).map((x) => ({ label: `Report: ${x.incidentType || "Incident"} at ${x.location || "Unknown"}`, time: x.status || "Pending" }))
          ]
        });
      } catch (e) {
        console.error("Failed to fetch admin data", e);
      }
    })();
  }, [user, navigate]);

  const barangayRows = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      const key = `${u.barangayCode || u.barangay || "unknown"}-${u.cityCode || u.cityName || "unknown"}`;
      if (!map.has(key)) {
        map.set(key, { barangay: u.barangay || "Unknown", city: u.cityName || "Unknown", captain: "Unassigned", status: "Pending" });
      }
      if ((u.role || "").toLowerCase() === "barangay captain" && (u.accountStatus || "").toUpperCase() === "APPROVED") {
        map.set(key, { ...map.get(key), captain: u.fullName || "Unnamed Captain", status: "Verified" });
      }
    });
    return [...map.values()].map((x) => [x.barangay, x.city, x.captain, x.status, "View"]);
  }, [users]);

  const adminUsers = users.filter((x) => {
    const role = (x.role || "").toUpperCase();
    return role === "OFFICIAL" || role === "SUPER ADMIN";
  });

  const handleApproveCaptain = async (captainId) => {
    if (!window.confirm("Approve this captain application?")) return;
    setApproveLoadingId(captainId);
    try {
      await api.post(`/admin/verifications/${captainId}/approve`);
      setApplications((prev) =>
        prev.map((app) =>
          app.id === captainId ? { ...app, accountStatus: "APPROVED" } : app
        )
      );
      setSelectedCaptain((prev) =>
        prev && prev.id === captainId ? { ...prev, accountStatus: "APPROVED" } : prev
      );
      alert("Captain approved successfully.");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to approve captain.");
    } finally {
      setApproveLoadingId(null);
    }
  };

  const toFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const captainRows = useMemo(() => {
    return applications.map((x) => {
      return [
        x.fullName || "Unknown",
        x.barangay || "Unknown",
        x.captainDetails?.governmentIdUrl ? "Uploaded" : "Missing",
        x.captainDetails?.certificateOfAppointmentUrl ? "Uploaded" : "Missing",
        x.contactNumber || "N/A",
        x.accountStatus || "PENDING",
        (
          <button
            type="button"
            className="action-btn"
            onClick={() => setSelectedCaptain(x)}
          >
            View
          </button>
        )
      ];
    });
  }, [applications]);

  const screens = {
    dashboard: <Overview overview={overview} setActive={setActive} />,
    analytics: <Section><SimpleTable columns={["Metric", "Value"]} rows={[["Emergency trends (reports)", reports.length], ["Barangay activity", barangayRows.length], ["Usage statistics (users)", users.length], ["Pending captain transfers", transfers.length]]} /></Section>,
    "audit-logs": <Section><SimpleTable columns={["Admin", "Action", "Time"]} rows={overview.recentActivity.map((x) => [user?.fullName || "Admin", x.label, x.time])} /></Section>,
    barangays: <Section><SimpleTable columns={["Barangay", "City", "Captain", "Status", "Actions"]} rows={barangayRows} /></Section>,
    "captain-verifications": <Section><SimpleTable columns={["Name", "Barangay", "ID", "Certificate", "Contact", "Status", "Actions"]} rows={captainRows} /></Section>,
    "captain-transfers": <AdminTransfersScreen />,
    "officials-verification": <Section><SimpleTable columns={["Name", "Barangay", "Role", "ID", "Status"]} rows={users.filter((x) => (x.role || "").toUpperCase() === "OFFICIAL").map((x) => [x.fullName || "Unknown", x.barangay || "Unknown", x.role || "OFFICIAL", x.validIdUrl ? "Uploaded" : "Missing", x.accountStatus || "APPROVED"])} /></Section>,
    users: <Section><SimpleTable columns={["Name", "Role", "Barangay", "Status"]} rows={users.map((x) => [x.fullName || "Unknown", x.role || "Unknown", x.barangay || "Unknown", x.accountStatus || "APPROVED"])} /></Section>,
    "emergency-reports": <Section><SimpleTable columns={["Location", "Barangay", "Status", "Time Submitted"]} rows={reports.map((x) => [x.location || "Unknown", x.user?.barangay || "Unknown", x.status || "PENDING", x.createdAt ? new Date(x.createdAt).toLocaleString() : "N/A"])} /></Section>,
    "evacuation-centers": <Section><SimpleTable columns={["Center", "Barangay", "Capacity", "Status"]} rows={centers.map((x) => [x.name || "Unnamed", x.barangayName || "Unknown", `${x.currentOccupancy || 0}/${x.capacity || 0}`, x.status || "Open"])} /></Section>,
    announcements: <Section><SimpleTable columns={["Announcement", "Scope", "Status"]} rows={[["Typhoon warning template", "All barangays", "Draft"], ["System maintenance advisory", "Specific area", "Draft"]]} /></Section>,
    "system-settings": <Section><SimpleTable columns={["Setting", "Status"]} rows={[["API integrations", "Configured"], ["Notification controls", "Configured"], ["Feature toggles", "Configured"]]} /></Section>,
    "system-logs": <Section><SimpleTable columns={["Event", "Level", "Timestamp"]} rows={reports.slice(0, 10).map((x) => [`Report ${x.id || "N/A"} processed`, (x.status || "INFO").toUpperCase(), x.createdAt ? new Date(x.createdAt).toLocaleString() : "N/A"])} /></Section>,
    "admin-management": <Section><SimpleTable columns={["Name", "Role", "Email", "Status"]} rows={adminUsers.map((x) => [x.fullName || "Unknown", x.role || "OFFICIAL", x.email || "N/A", x.accountStatus || "APPROVED"])} /></Section>
  };

  const current = TITLES[active] || TITLES.dashboard;

  return (
    <div className="rb-dashboard">
      <header className="rb-header admin-rb-header" style={{ marginBottom: 20, borderRadius: 12 }}>
        <div className="admin-rb-header-text">
          <div className="rb-header-title">{current.title}</div>
          <div className="admin-rb-header-sub">{current.subtitle}</div>
        </div>
        <div className="rb-header-actions">
          <div className="rb-notif-bell">
            <Bell size={20} />
            <div className="rb-notif-count">
              {overview.pendingBarangayVerifications + overview.pendingCaptainTransfers}
            </div>
          </div>
        </div>
      </header>

      <div className="admin-content-body">{screens[active] || screens.dashboard}</div>

      {selectedCaptain && (
        <div className="modal-overlay" onClick={() => setSelectedCaptain(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Captain Application Details</h2>
              <button type="button" className="close-btn" onClick={() => setSelectedCaptain(null)}>X</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-section">
                  <h3>Applicant</h3>
                  <div className="info-row"><span className="info-label">Name</span><span className="info-value">{selectedCaptain.fullName || "Unknown"}</span></div>
                  <div className="info-row"><span className="info-label">Email</span><span className="info-value">{selectedCaptain.email || "N/A"}</span></div>
                  <div className="info-row"><span className="info-label">Contact</span><span className="info-value">{selectedCaptain.contactNumber || "N/A"}</span></div>
                  <div className="info-row"><span className="info-label">Status</span><span className="info-value">{selectedCaptain.accountStatus || "PENDING"}</span></div>
                </div>
                <div className="info-section">
                  <h3>Barangay Info</h3>
                  <div className="info-row"><span className="info-label">Barangay</span><span className="info-value">{selectedCaptain.barangay || "N/A"}</span></div>
                  <div className="info-row"><span className="info-label">City</span><span className="info-value">{selectedCaptain.cityName || "N/A"}</span></div>
                  <div className="info-row"><span className="info-label">Province</span><span className="info-value">{selectedCaptain.provinceName || "N/A"}</span></div>
                  <div className="info-row"><span className="info-label">Region</span><span className="info-value">{selectedCaptain.regionName || "N/A"}</span></div>
                </div>
              </div>

              <div className="documents-section">
                <h3>Verification Documents</h3>
                <div className="documents-grid">
                  <div className="document-card">
                    <span className="document-title">Government ID</span>
                    <div className="document-preview">
                      {selectedCaptain.captainDetails?.governmentIdUrl ? (
                        <a href={toFileUrl(selectedCaptain.captainDetails.governmentIdUrl)} target="_blank" rel="noreferrer">Open document</a>
                      ) : (
                        <span>Missing</span>
                      )}
                    </div>
                  </div>
                  <div className="document-card">
                    <span className="document-title">Certificate of Appointment</span>
                    <div className="document-preview">
                      {selectedCaptain.captainDetails?.certificateOfAppointmentUrl ? (
                        <a href={toFileUrl(selectedCaptain.captainDetails.certificateOfAppointmentUrl)} target="_blank" rel="noreferrer">Open document</a>
                      ) : (
                        <span>Missing</span>
                      )}
                    </div>
                  </div>
                  <div className="document-card">
                    <span className="document-title">Barangay Resolution</span>
                    <div className="document-preview">
                      {selectedCaptain.captainDetails?.barangayResolutionUrl ? (
                        <a href={toFileUrl(selectedCaptain.captainDetails.barangayResolutionUrl)} target="_blank" rel="noreferrer">Open document</a>
                      ) : (
                        <span>Not provided</span>
                      )}
                    </div>
                  </div>
                  <div className="document-card">
                    <span className="document-title">Selfie with ID</span>
                    <div className="document-preview">
                      {selectedCaptain.captainDetails?.selfieUrl ? (
                        <a href={toFileUrl(selectedCaptain.captainDetails.selfieUrl)} target="_blank" rel="noreferrer">Open document</a>
                      ) : (
                        <span>Missing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn" onClick={() => setSelectedCaptain(null)}>Close</button>
              {["PENDING_VERIFICATION", "PENDING"].includes((selectedCaptain.accountStatus || "").toUpperCase()) && (
                <button
                  type="button"
                  className="action-btn btn-approve"
                  onClick={() => handleApproveCaptain(selectedCaptain.id)}
                  disabled={approveLoadingId === selectedCaptain.id}
                >
                  {approveLoadingId === selectedCaptain.id ? "Approving..." : "Approve Captain"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
