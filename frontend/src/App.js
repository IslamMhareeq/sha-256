// src/App.js
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Register       from './components/Register';
import Login          from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword  from './components/ResetPassword';
import Dashboard      from './components/Dashboard';

// A small Navbar component that hides auth links on /dashboard
function Navbar() {
  const { pathname } = useLocation();                     // get current path :contentReference[oaicite:0]{index=0}
  const hideAuthLinks = pathname === '/dashboard';        // true on Dashboard route

  return (
    <nav>
      { !hideAuthLinks ? (
        <>
          <Link to="/register">Register</Link> |{' '}
          <Link to="/login">Login</Link> |{' '}
          <Link to="/forgot-password">Forgot Password</Link>
        </>
      ) : (
        <Link to="/dashboard">Dashboard</Link>
      ) }
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/register"        element={<Register />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/dashboard"       element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
