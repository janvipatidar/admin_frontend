// Persistent sidebar navigation for the admin layout
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const adminRaw = localStorage.getItem('admin');
  const admin = adminRaw ? JSON.parse(adminRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/admin/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    'nav-link' + (isActive ? ' active' : '');

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">PC</div>
        <div>
          <div className="brand-title">Placement CRM</div>
          <div className="brand-subtitle">Admin Console</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className={linkClass}>
          <span className="nav-icon">⌂</span> Dashboard
        </NavLink>
        <NavLink to="/admin/candidates" className={linkClass}>
          <span className="nav-icon">☰</span> Candidates
        </NavLink>
        <NavLink to="/admin/candidates/search" className={linkClass}>
          <span className="nav-icon">⌕</span> Search
        </NavLink>
        <NavLink to="/admin/contacts" className={linkClass}>
          <span className="nav-icon">✉</span> Contact Messages
        </NavLink>
        <NavLink to="/admin/candidate/new" className={linkClass}>
          <span className="nav-icon">+</span> Add Candidate
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {admin && (
          <div className="admin-info">
            <div className="admin-email" title={admin.email}>{admin.email}</div>
            <div className="admin-role">{admin.role}</div>
          </div>
        )}
        <button className="btn btn-outline btn-block" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
