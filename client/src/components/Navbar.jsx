import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineFolder,
  HiOutlineClipboardList,
  HiOutlineLogout,
} from 'react-icons/hi';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
    { to: '/projects', label: 'Projects', icon: <HiOutlineFolder /> },
    { to: '/tasks', label: 'Tasks', icon: <HiOutlineClipboardList /> },
  ];

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">TeamFlow</span>
        </Link>
      </div>

      <div className="navbar-links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="navbar-user">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className={`user-role ${isAdmin ? 'role-admin' : 'role-member'}`}>
              {user?.role}
            </span>
          </div>
        </div>
        <button className="btn-logout" onClick={logout} id="logout-btn" title="Logout">
          <HiOutlineLogout />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
