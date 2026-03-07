import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import AuthLayout from './components/AuthLayout';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterBarangay from './pages/RegisterBarangay';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import TransferVerificationPage from './pages/TransferVerificationPage';
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
