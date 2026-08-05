import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Trainings } from './pages/Trainings';
import { TrainingDetails } from './pages/TrainingDetails';
import { AddTraining } from './pages/AddTraining';
import { Certifications } from './pages/Certifications';
import { AddCertification } from './pages/AddCertification';
import { CertificationDetails } from './pages/CertificationDetails';
import { MyAssignments } from './pages/MyAssignments';
import { ManageAssignments } from './pages/ManageAssignments';
import { Users } from './pages/Users';
import { Hierarchy } from './pages/Hierarchy';
import { Unauthorized } from './pages/Unauthorized';
import { RoleGuard } from './components/RoleGuard';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { Profile } from './pages/Profile';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'COLLABORATOR' || user?.role === 'USER') {
    return <Navigate to="/my-assignments" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              
              {/* Dashboard only accessible to Management & Leadership roles */}
              <Route element={<RoleGuard allowedRoles={['ADMIN', 'DIRECTOR', 'TRAINING_MANAGER', 'CAREER_MANAGER', 'SQUAD_LEAD', 'MANAGER']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              <Route path="/trainings" element={<Trainings />} />
              <Route path="/trainings/:id" element={<TrainingDetails />} />
              
              <Route path="/certifications" element={<Certifications />} />
              <Route path="/certifications/:id" element={<CertificationDetails />} />

              <Route path="/profile" element={<Profile />} />

              {/* Collaborator Only Route */}
              <Route element={<RoleGuard allowedRoles={['COLLABORATOR', 'USER', 'SQUAD_LEAD']} />}>
                <Route path="/my-assignments" element={<MyAssignments />} />
              </Route>
              
              {/* Restricted Management Routes */}
              <Route element={<RoleGuard allowedRoles={['ADMIN', 'TRAINING_MANAGER']} />}>
                <Route path="/trainings/add" element={<AddTraining />} />
                <Route path="/certifications/add" element={<AddCertification />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['ADMIN', 'DIRECTOR', 'TRAINING_MANAGER', 'CAREER_MANAGER', 'SQUAD_LEAD', 'MANAGER']} />}>
                <Route path="/manage-assignments" element={<ManageAssignments />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
                <Route path="/hierarchy" element={<Hierarchy />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
                <Route path="/users" element={<Users />} />
              </Route>

            </Route>
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
