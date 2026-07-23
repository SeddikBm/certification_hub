import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import TopAppBar from './components/TopAppBar';

import DashboardPage from './pages/DashboardPage';
import CertificationsPage from './pages/CertificationsPage';
import TrainingsPage from './pages/TrainingsPage';
import MyAssignmentsPage from './pages/MyAssignmentsPage';
import ManageAssignmentsPage from './pages/ManageAssignmentsPage';
import { UsersPage } from './pages/UsersPage';
import { HierarchyPage } from './pages/HierarchyPage';

const Layout = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col md:pl-64 h-full relative w-full">
        <TopAppBar />
        <main className="flex-1 overflow-y-auto pt-20 pb-10 px-4 md:px-margin-desktop bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="certifications" element={<CertificationsPage />} />
          <Route path="certifications/:id" element={<div>Certification Details</div>} />
          <Route path="trainings" element={<TrainingsPage />} />
          <Route path="my-assignments" element={<MyAssignmentsPage />} />
          <Route path="manage-assignments" element={<ManageAssignmentsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="hierarchy" element={<HierarchyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
