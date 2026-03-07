import React from 'react';
import Sidebar from './Sidebar';
import '../pages/DashboardLayout.css';

const Layout = ({ children }) => {
    return (
        <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#f9fafb' }}>
            <Sidebar />
            <div className="main-content" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    );
};

export default Layout;
