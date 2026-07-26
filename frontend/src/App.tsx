import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Trainings } from './pages/Trainings';
import { AddTraining } from './pages/AddTraining';
import { Certifications } from './pages/Certifications';
import { AddCertification } from './pages/AddCertification';
import { CertificationDetails } from './pages/CertificationDetails';
import { MyAssignments } from './pages/MyAssignments';
import { ManageAssignments } from './pages/ManageAssignments';
import { Users } from './pages/Users';
import { Hierarchy } from './pages/Hierarchy';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trainings" element={<Trainings />} />
              <Route path="/trainings/add" element={<AddTraining />} />
              <Route path="/certifications" element={<Certifications />} />
              <Route path="/certifications/add" element={<AddCertification />} />
              <Route path="/certifications/:id" element={<CertificationDetails />} />
              <Route path="/my-assignments" element={<MyAssignments />} />
              <Route path="/manage-assignments" element={<ManageAssignments />} />
              <Route path="/users" element={<Users />} />
              <Route path="/hierarchy" element={<Hierarchy />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
