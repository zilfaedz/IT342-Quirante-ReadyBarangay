import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LogoutModal from './LogoutModal';

const ICONS = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    analytics: "M9 17v-6m4 6V7m4 10v-4M5 19h14",
    logs: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2",
    barangay: "M3 21h18M4 21V7l8-4 8 4v14",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    transfer: "M4 7h11m0 0l-3-3m3 3l-3 3M20 17H9m0 0l3-3m-3 3l3 3",
    officials: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
    users: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    reports: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2",
    map: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
    cloud: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
    settings: "M11.049 2.927c.3-1.14 1.93-1.14 2.23 0l.2.76a1.15 1.15 0 001.64.76l.7-.35c1.06-.53 2.22.63 1.69 1.69l-.35.7a1.15 1.15 0 00.76 1.64l.76.2c1.14.3 1.14 1.93 0 2.23l-.76.2a1.15 1.15 0 00-.76 1.64l.35.7c.53 1.06-.63 2.22-1.69 1.69l-.7-.35a1.15 1.15 0 00-1.64.76l-.2.76c-.3 1.14-1.93 1.14-2.23 0l-.2-.76a1.15 1.15 0 00-1.64-.76l-.7.35c-1.06.53-2.22-.63-1.69-1.69l.35-.7a1.15 1.15 0 00-.76-1.64l-.76-.2c-1.14-.3-1.14-1.93 0-2.23l.76-.2a1.15 1.15 0 00.76-1.64l-.35-.7c-.53-1.06.63-2.22 1.69-1.69l.7.35a1.15 1.15 0 001.64-.76l.2-.76z",
    profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    admin: "M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 4a8.94 8.94 0 01-.34 2.44l2.05 1.6-2 3.46-2.48-.99a8.98 8.98 0 01-2.11 1.22L15.5 22h-4l-.56-2.27a8.98 8.98 0 01-2.11-1.22l-2.48.99-2-3.46 2.05-1.6A8.94 8.94 0 013.06 12c0-.83.12-1.64.34-2.44L1.35 7.96l2-3.46 2.48.99c.64-.51 1.35-.92 2.11-1.22L8.5 2h4l.56 2.27c.76.3 1.47.71 2.11 1.22l2.48-.99 2 3.46-2.05 1.6c.22.8.34 1.61.34 2.44z",
    phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
};

const Icon = ({ d, size = 18 }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
);

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);

    const normalizedRole = (user?.role || "").toUpperCase();
    const isSuperAdmin = normalizedRole === "SUPER ADMIN" || normalizedRole === "SUPER_ADMIN";
    const isOfficer = normalizedRole === "OFFICIAL";
    const isCaptain = normalizedRole === "CAPTAIN" || normalizedRole === "BARANGAY CAPTAIN";
    const isResponder = normalizedRole === "RESPONDER";
    const isOfficialPortal = isSuperAdmin;
    const roleLabel = normalizedRole === "OFFICIAL"
        ? "Barangay Official"
        : (normalizedRole === "SUPER ADMIN" || normalizedRole === "SUPER_ADMIN")
            ? "System Administrator"
            : normalizedRole === "BARANGAY CAPTAIN" || normalizedRole === "CAPTAIN"
                ? "Barangay Captain"
                : normalizedRole === "RESPONDER"
                    ? "Responder"
                    : "Resident";

    const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
    const isAdminPage = location.pathname === '/admin/verifications';
    const isOfficerDashboard = isOfficer && location.pathname === '/dashboard';
    const isCaptainDashboard = isCaptain && location.pathname === '/dashboard';
    const isResponderDashboard = isResponder && location.pathname === '/dashboard';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const goAdminTab = (tab) => navigate(`/admin/verifications?tab=${tab}`);

    const renderNavButton = ({ active, onClick, icon, label }) => (
        <button
            className={`rb-nav-item ${active ? 'active' : ''}`}
            onClick={onClick}
            type="button"
        >
            <Icon d={icon} />
            {label}
        </button>
    );

    const renderAdminItem = (tab, label, icon) => (
        renderNavButton({
            active: isAdminPage && currentTab === tab,
            onClick: () => goAdminTab(tab),
            icon,
            label
        })
    );

    return (
        <>
            <aside className="rb-sidebar">
                <div
                    className="rb-sidebar-logo"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(isOfficialPortal ? '/admin/verifications?tab=dashboard' : '/dashboard?tab=dashboard')}
                >
                    <div className="logo-icon">RB</div>
                    <div className="logo-text">
                        ReadyBarangay
                        <span>{isOfficialPortal ? 'Admin Portal' : 'Resident Portal'}</span>
                    </div>
                </div>

                <nav className="rb-nav">
                    {isOfficialPortal ? (
                        <>
                            <div className="rb-nav-section">Main</div>
                            {renderAdminItem('dashboard', 'Dashboard', ICONS.home)}
                            {renderAdminItem('analytics', 'Analytics', ICONS.analytics)}
                            {renderAdminItem('audit-logs', 'Audit Logs', ICONS.logs)}

                            <div className="rb-nav-section">Barangay Management</div>
                            {renderAdminItem('barangays', 'Barangays', ICONS.barangay)}
                            {renderAdminItem('captain-verifications', 'Captain Verifications', ICONS.shield)}
                            {renderAdminItem('captain-transfers', 'Captain Transfers', ICONS.transfer)}
                            {renderAdminItem('officials-verification', 'Officials Verification', ICONS.officials)}

                            <div className="rb-nav-section">Community</div>
                            {renderAdminItem('users', 'Users', ICONS.users)}
                            {renderAdminItem('emergency-reports', 'Emergency Reports', ICONS.reports)}
                            {renderAdminItem('evacuation-centers', 'Evacuation Centers', ICONS.map)}
                            {renderAdminItem('announcements', 'Announcements', ICONS.cloud)}

                            <div className="rb-nav-section">System</div>
                            {renderAdminItem('system-settings', 'System Settings', ICONS.settings)}
                            {renderAdminItem('system-logs', 'System Logs', ICONS.logs)}

                            <div className="rb-nav-section">Account</div>
                            <button
                                className={`rb-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
                                onClick={() => navigate('/profile')}
                                type="button"
                            >
                                <Icon d={ICONS.profile} />
                                Profile
                            </button>
                            {renderAdminItem('admin-management', 'Admin Management', ICONS.admin)}
                            <button className="rb-nav-item" onClick={() => setShowLogoutModal(true)} type="button">
                                <Icon d={ICONS.logout} />
                                Logout
                            </button>
                        </>
                    ) : isOfficerDashboard ? (
                        <>
                            <div className="rb-nav-section">Main</div>
                            {renderNavButton({
                                active: currentTab === 'overview' || currentTab === 'dashboard',
                                onClick: () => navigate('/dashboard?tab=overview'),
                                icon: ICONS.home,
                                label: 'Overview'
                            })}
                            {renderNavButton({
                                active: currentTab === 'evacuation',
                                onClick: () => navigate('/dashboard?tab=evacuation'),
                                icon: ICONS.map,
                                label: 'Evacuation Centers'
                            })}
                            {renderNavButton({
                                active: currentTab === 'directory',
                                onClick: () => navigate('/dashboard?tab=directory'),
                                icon: ICONS.users,
                                label: 'Resident Directory'
                            })}
                            {renderNavButton({
                                active: currentTab === 'announcements',
                                onClick: () => navigate('/dashboard?tab=announcements'),
                                icon: ICONS.cloud,
                                label: 'Announcements'
                            })}
                            {renderNavButton({
                                active: currentTab === 'resources',
                                onClick: () => navigate('/dashboard?tab=resources'),
                                icon: ICONS.barangay,
                                label: 'Resources'
                            })}
                            <div className="rb-nav-section">Account</div>
                            {renderNavButton({
                                active: currentTab === 'profile',
                                onClick: () => navigate('/dashboard?tab=profile'),
                                icon: ICONS.profile,
                                label: 'Profile'
                            })}
                            <button className="rb-nav-item" onClick={() => setShowLogoutModal(true)} type="button">
                                <Icon d={ICONS.logout} />
                                Logout
                            </button>
                        </>
                    ) : isCaptainDashboard ? (
                        <>
                            <div className="rb-nav-section">Main</div>
                            {renderNavButton({
                                active: currentTab === 'overview' || currentTab === 'dashboard',
                                onClick: () => navigate('/dashboard?tab=overview'),
                                icon: ICONS.home,
                                label: 'Command Overview'
                            })}
                            {renderNavButton({
                                active: currentTab === 'incidents',
                                onClick: () => navigate('/dashboard?tab=incidents'),
                                icon: ICONS.reports,
                                label: 'All Incidents'
                            })}
                            {renderNavButton({
                                active: currentTab === 'evacuation',
                                onClick: () => navigate('/dashboard?tab=evacuation'),
                                icon: ICONS.map,
                                label: 'Evacuation Centers'
                            })}
                            {renderNavButton({
                                active: currentTab === 'resources',
                                onClick: () => navigate('/dashboard?tab=resources'),
                                icon: ICONS.barangay,
                                label: 'Budget & Resources'
                            })}
                            {renderNavButton({
                                active: currentTab === 'personnel',
                                onClick: () => navigate('/dashboard?tab=personnel'),
                                icon: ICONS.users,
                                label: 'Personnel'
                            })}
                            {renderNavButton({
                                active: currentTab === 'announcements',
                                onClick: () => navigate('/dashboard?tab=announcements'),
                                icon: ICONS.cloud,
                                label: 'Announcements'
                            })}

                            <div className="rb-nav-section">Account</div>
                            {renderNavButton({
                                active: currentTab === 'profile',
                                onClick: () => navigate('/dashboard?tab=profile'),
                                icon: ICONS.profile,
                                label: 'Profile'
                            })}
                            <button className="rb-nav-item" onClick={() => setShowLogoutModal(true)} type="button">
                                <Icon d={ICONS.logout} />
                                Logout
                            </button>
                        </>
                    ) : isResponderDashboard ? (
                        <>
                            <div className="rb-nav-section">Main</div>
                            {renderNavButton({
                                active: currentTab === 'missions' || currentTab === 'dashboard',
                                onClick: () => navigate('/dashboard?tab=missions'),
                                icon: ICONS.home,
                                label: 'My Missions'
                            })}
                            {renderNavButton({
                                active: currentTab === 'incidents',
                                onClick: () => navigate('/dashboard?tab=incidents'),
                                icon: ICONS.reports,
                                label: 'Incident List'
                            })}
                            {renderNavButton({
                                active: currentTab === 'map',
                                onClick: () => navigate('/dashboard?tab=map'),
                                icon: ICONS.map,
                                label: 'Response Map'
                            })}
                            {renderNavButton({
                                active: currentTab === 'announcements',
                                onClick: () => navigate('/dashboard?tab=announcements'),
                                icon: ICONS.cloud,
                                label: 'Announcements'
                            })}
                            <div className="rb-nav-section">Account</div>
                            {renderNavButton({
                                active: currentTab === 'profile',
                                onClick: () => navigate('/dashboard?tab=profile'),
                                icon: ICONS.profile,
                                label: 'Profile'
                            })}
                            <button className="rb-nav-item" onClick={() => setShowLogoutModal(true)} type="button">
                                <Icon d={ICONS.logout} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="rb-nav-section">Main</div>
                            <button className={`rb-nav-item ${location.pathname === '/dashboard' && !location.search ? 'active' : ''}`} onClick={() => navigate('/dashboard')} type="button">
                                <Icon d={ICONS.home} />
                                Dashboard
                            </button>
                            <button className={`rb-nav-item ${location.pathname === '/dashboard' && location.search === '?tab=report' ? 'active' : ''}`} onClick={() => navigate('/dashboard?tab=report')} type="button">
                                <Icon d={ICONS.reports} />
                                Emergency Reports
                            </button>
                            <button className={`rb-nav-item ${location.pathname === '/dashboard' && location.search === '?tab=evacuation' ? 'active' : ''}`} onClick={() => navigate('/dashboard?tab=evacuation')} type="button">
                                <Icon d={ICONS.map} />
                                Evacuation Centers
                            </button>
                            <button className={`rb-nav-item ${location.pathname === '/dashboard' && location.search === '?tab=announcements' ? 'active' : ''}`} onClick={() => navigate('/dashboard?tab=announcements')} type="button">
                                <Icon d={ICONS.cloud} />
                                Announcements
                            </button>

                            <div className="rb-nav-section">Community</div>
                            <button className={`rb-nav-item ${location.pathname === '/dashboard' && location.search === '?tab=directory' ? 'active' : ''}`} onClick={() => navigate('/dashboard?tab=directory')} type="button">
                                <Icon d={ICONS.users} />
                                Community Directory
                            </button>
                            <button className={`rb-nav-item ${location.pathname === '/dashboard' && location.search === '?tab=hotlines' ? 'active' : ''}`} onClick={() => navigate('/dashboard?tab=hotlines')} type="button">
                                <Icon d={ICONS.phone} />
                                Hotlines
                            </button>

                            <div className="rb-nav-section">Account</div>
                            <button className={`rb-nav-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile')} type="button">
                                <Icon d={ICONS.profile} />
                                My Profile
                            </button>
                            <button className="rb-nav-item" onClick={() => setShowLogoutModal(true)} type="button">
                                <Icon d={ICONS.logout} />
                                Logout
                            </button>
                        </>
                    )}
                </nav>

                <div className="rb-sidebar-footer">
                    <div className="rb-user-pill" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                        <div className="rb-avatar">{user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}</div>
                        <div className="rb-user-info">
                            <div className="rb-user-name">{user?.fullName || user?.email || 'User'}</div>
                            <div className="rb-user-role">{roleLabel}</div>
                        </div>
                    </div>
                </div>
            </aside>

            <LogoutModal
                show={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
            />
        </>
    );
};

export default Sidebar;
