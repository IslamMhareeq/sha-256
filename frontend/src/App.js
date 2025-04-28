// src/App.js
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Register       from './components/Register';
import Login          from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword  from './components/ResetPassword';
import Dashboard      from './components/Dashboard';

// Navbar: hide auth links on dashboard
function Navbar() {
  const { pathname } = useLocation();
  const hideAuthLinks = pathname === '/dashboard';

  return (
    <nav>
      {!hideAuthLinks ? (
        <>
          <Link to="/register">Register</Link> |{' '}
          <Link to="/login">Login</Link> |{' '}
          <Link to="/forgot-password">Forgot Password</Link>
        </>
      ) : (
        <Link to="/dashboard">Dashboard</Link>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* redirect root → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/dashboard"       element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
