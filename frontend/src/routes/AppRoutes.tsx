import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import Login from '../pages/Login';
import RoleLoginForm from '../pages/RoleLoginForm';
import OperatorDashboard from '../pages/OperatorDashboard';
import UploadPage from '../pages/UploadPage';
import HistoryPage from '../pages/HistoryPage';
import ReviewerDashboard from '../pages/ReviewerDashboard';
import ExceptionQueue from '../pages/ExceptionQueue';
import LoanDetail from '../pages/LoanDetail';
import ConsumerDashboard from '../pages/ConsumerDashboard';
import VerifiedRecords from '../pages/VerifiedRecords';
import VerifiedDetail from '../pages/VerifiedDetail';
import AuditTrailViewer from '../pages/AuditTrailViewer';

// Auth Guard: ensures user is logged in
interface GuardProps {
  children: React.ReactElement;
}

const AuthGuard: React.FC<GuardProps> = ({ children }) => {
  const role = localStorage.getItem('user_role');
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Role Guard: ensures user role matches path
interface RoleGuardProps {
  children: React.ReactElement;
  allowedRole: 'operator' | 'reviewer' | 'consumer';
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRole }) => {
  const role = localStorage.getItem('user_role');
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  if (role !== allowedRole) {
    return <Navigate to={`/${role}`} replace />;
  }
  return children;
};

// Root Redirect Helper
const RootRedirect = () => {
  const role = localStorage.getItem('user_role');
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/${role}`} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth entrypoint */}
      <Route path="/login" element={<Login />} />
      <Route
        path="/login/operator"
        element={
          <RoleLoginForm
            role="operator"
            title="Data Operator Sign In"
            description="Sign in to the Data Operations workspace"
            redirect="/operator"
          />
        }
      />
      <Route
        path="/login/reviewer"
        element={
          <RoleLoginForm
            role="reviewer"
            title="Exception Reviewer Sign In"
            description="Sign in to the Review workspace"
            redirect="/reviewer"
          />
        }
      />
      <Route
        path="/login/consumer"
        element={
          <RoleLoginForm
            role="consumer"
            title="Data Consumer Sign In"
            description="Sign in to the Verified Data workspace"
            redirect="/consumer"
          />
        }
      />

      {/* Main dashboard wrap shell */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }
      >
        {/* Redirect root / to dynamic dashboard depending on auth role */}
        <Route index element={<RootRedirect />} />

        {/* Data Operator Workflow */}
        <Route
          path="operator"
          element={
            <RoleGuard allowedRole="operator">
              <OperatorDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="operator/upload"
          element={
            <RoleGuard allowedRole="operator">
              <UploadPage />
            </RoleGuard>
          }
        />
        <Route
          path="operator/history"
          element={
            <RoleGuard allowedRole="operator">
              <HistoryPage />
            </RoleGuard>
          }
        />
        <Route
          path="operator/exceptions/:id"
          element={
            <RoleGuard allowedRole="operator">
              <LoanDetail />
            </RoleGuard>
          }
        />

        {/* Reviewer Exception Workflow */}
        <Route
          path="reviewer"
          element={
            <RoleGuard allowedRole="reviewer">
              <ReviewerDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="reviewer/exceptions"
          element={
            <RoleGuard allowedRole="reviewer">
              <ExceptionQueue />
            </RoleGuard>
          }
        />
        <Route
          path="reviewer/exceptions/:id"
          element={
            <RoleGuard allowedRole="reviewer">
              <LoanDetail />
            </RoleGuard>
          }
        />

        {/* Data Consumer Ledger */}
        <Route
          path="consumer"
          element={
            <RoleGuard allowedRole="consumer">
              <ConsumerDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="consumer/verified"
          element={
            <RoleGuard allowedRole="consumer">
              <VerifiedRecords />
            </RoleGuard>
          }
        />
        <Route
          path="consumer/verified/:id"
          element={
            <RoleGuard allowedRole="consumer">
              <VerifiedDetail />
            </RoleGuard>
          }
        />
        <Route
          path="consumer/audit/:loanId"
          element={
            <RoleGuard allowedRole="consumer">
              <AuditTrailViewer />
            </RoleGuard>
          }
        />
      </Route>

      {/* Wildcard Fallback redirection */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};
export default AppRoutes;
