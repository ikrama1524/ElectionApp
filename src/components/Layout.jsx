import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './Layout.css';

const Layout = () => {
  const { user, logout, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = hasAnyRole(['SUPER_ADMIN', 'ADMIN']);
  const isCandidateAdmin = hasAnyRole(['CANDIDATE_ADMIN']);
  const isCandidateUser = hasAnyRole(['CANDIDATE_USER']);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <span className="nav-brand-icon">🗳️</span>
            <span className="nav-brand-text">Election Search</span>
          </Link>
          <div className="nav-links">
            {isAdmin && (
              <>
                <Link 
                  to="/admin" 
                  className={isActive('/admin') && !location.pathname.includes('/candidates') && !location.pathname.includes('/import') ? 'nav-link active' : 'nav-link'}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/admin/candidates" 
                  className={location.pathname.includes('/candidates') ? 'nav-link active' : 'nav-link'}
                >
                  Candidates
                </Link>
                <Link 
                  to="/admin/import" 
                  className={isActive('/admin/import') ? 'nav-link active' : 'nav-link'}
                >
                  Import CSV
                </Link>
                <Link 
                  to="/search" 
                  className={isActive('/search') ? 'nav-link active' : 'nav-link'}
                >
                  Search
                </Link>
              </>
            )}
            {isCandidateAdmin && (
              <>
                <Link 
                  to="/candidate" 
                  className={isActive('/candidate') && !location.pathname.includes('/allow-list') && !location.pathname.includes('/users') ? 'nav-link active' : 'nav-link'}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/candidate/allow-list" 
                  className={isActive('/candidate/allow-list') ? 'nav-link active' : 'nav-link'}
                >
                  Allow List
                </Link>
                <Link 
                  to="/candidate/users" 
                  className={isActive('/candidate/users') ? 'nav-link active' : 'nav-link'}
                >
                  Users
                </Link>
                <Link 
                  to="/search" 
                  className={isActive('/search') ? 'nav-link active' : 'nav-link'}
                >
                  Search
                </Link>
              </>
            )}
            {isCandidateUser && (
              <Link 
                to="/search" 
                className={isActive('/search') ? 'nav-link active' : 'nav-link'}
              >
                Search
              </Link>
            )}
            <div className="nav-user">
              <div className="nav-user-info">
                <span className="nav-user-email">{user?.username || user?.email}</span>
                <span className={`nav-role badge badge-${user?.role === 'SUPER_ADMIN' ? 'primary' : 'secondary'}`}>
                  {user?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm logout-button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
