import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './shared/auth/AuthContext';
import ProtectedRoute from './shared/auth/ProtectedRoute';
import ScrollToTop from './shared/layout/ScrollToTop';
import Layout from './shared/layout/Layout';
import LandingPage from './features/home/LandingPage';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import RegisterBarangay from './features/auth/RegisterBarangay';
import Dashboard from './features/dashboard/Dashboard';
import Profile from './features/profile/Profile';
import AdminDashboard from './features/admin/AdminDashboard';
import TransferVerificationPage from './features/transfers/TransferVerificationPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="app">
          <div className="content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-barangay" element={<RegisterBarangay />} />
              <Route path="/verify-transfer/:token" element={<TransferVerificationPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['RESIDENT', 'OFFICIAL', 'RESPONDER', 'CAPTAIN', 'Barangay Captain', 'Super Admin']}>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['RESIDENT', 'OFFICIAL', 'RESPONDER', 'CAPTAIN', 'Barangay Captain', 'Super Admin']}>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin']}>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/unauthorized"
                element={
                  <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h1>403 - Forbidden</h1>
                    <p>You do not have permission to view this page.</p>
                    <a href="/" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Return to Home</a>
                  </div>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
