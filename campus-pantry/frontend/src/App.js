import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatePostPage from './pages/CreatePostPage';
import OrganizationDashboard from './pages/OrganizationDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';

const ToastStack = ({ toasts }) => (
  <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50 pointer-events-none">
    {toasts.map((toast, idx) => (
      <div
        key={toast.id}
        className={`bg-gray-900 text-white rounded-lg shadow-lg px-4 py-3 min-w-[260px] pointer-events-auto ${
          toast.fading ? 'animate-toast-out' : 'animate-toast-in'
        }`}
        style={{ animationDelay: `${idx * 120}ms` }}
      >
        <div className="text-xs uppercase text-primary-200 font-semibold tracking-wide mb-1">New post</div>
        <div className="font-semibold text-sm">{toast.title}</div>
        <div className="text-xs text-gray-300 mt-1">{toast.time}</div>
      </div>
    ))}
  </div>
);

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const [toasts, setToasts] = useState([]);

  const showToasts = () => {
    const now = Date.now();
    const sample = [
      { title: 'Bagels were posted', time: '3 minutes ago' },
      { title: 'Leftover dining doughnuts', time: '10 minutes ago' },
      { title: 'Fresh tacos for pickup', time: '18 minutes ago' },
    ].map((item, i) => ({
      ...item,
      id: `toast-${now}-${i}`,
      fading: false,
    }));
    setToasts(sample);

    sample.forEach((toast, i) => {
      setTimeout(() => {
        // start fade-out
        setToasts((prev) =>
          prev.map((t) => (t.id === toast.id ? { ...t, fading: true } : t))
        );
        // remove after fade duration
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 350); // should match toast-out animation duration
      }, 4500 + i * 1000);
    });
  };

  // Fire on login events (dispatched from login page) and also when auth becomes true (token on page load)
  useEffect(() => {
    const handler = () => showToasts();
    window.addEventListener('user-logged-in', handler);
    return () => window.removeEventListener('user-logged-in', handler);
  }, []);

  useEffect(() => {
    if (isAuthenticated) showToasts();
  }, [isAuthenticated]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/create-post"
          element={
            <PrivateRoute>
              <CreatePostPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/org-dashboard"
          element={
            <PrivateRoute>
              <OrganizationDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastStack toasts={toasts} />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppLayout />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


