import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import { ToastContainer } from './components/Toast';
import Login from './pages/Login';
import Search from './pages/search/Search';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCandidates from './pages/admin/Candidates';
import AdminAllowList from './pages/admin/AllowList';
import AdminPrabhags from './pages/admin/Prabhags';
import AdminUsers from './pages/admin/Users';
import AdminUsageAudit from './pages/admin/UsageAudit';
import AdminImportCsv from './pages/admin/ImportCsv';
import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateAllowList from './pages/candidate/AllowList';
import CandidateUsers from './pages/candidate/Users';
import './styles/design-system.css';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes with layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
            {/* Search - accessible to all authenticated users */}
            <Route path="search" element={<Search />} />
            
            {/* Admin routes - only for ADMIN and SUPER_ADMIN */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/candidates"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminCandidates />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/candidates/:candidateId"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <Navigate to="prabhags" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/candidates/:candidateId/allow-list"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminAllowList />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/candidates/:candidateId/prabhags"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminPrabhags />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/candidates/:candidateId/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/candidates/:candidateId/usage"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminUsageAudit />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/import"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminImportCsv />
                </ProtectedRoute>
              }
            />
            
            {/* Candidate routes - only for CANDIDATE_ADMIN */}
            <Route
              path="candidate"
              element={
                <ProtectedRoute allowedRoles={['CANDIDATE_ADMIN']}>
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="candidate/allow-list"
              element={
                <ProtectedRoute allowedRoles={['CANDIDATE_ADMIN']}>
                  <CandidateAllowList />
                </ProtectedRoute>
              }
            />
            <Route
              path="candidate/users"
              element={
                <ProtectedRoute allowedRoles={['CANDIDATE_ADMIN']}>
                  <CandidateUsers />
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route index element={<Navigate to="/search" replace />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
