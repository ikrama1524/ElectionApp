import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="page-container">
      <div className="not-found">
        <div className="not-found-icon">404</div>
        <h1>Page Not Found</h1>
        <p className="page-subtitle">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/admin" className="btn btn-primary">
            Go to Dashboard
          </Link>
          <Link to="/search" className="btn btn-secondary">
            Go to Search
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

