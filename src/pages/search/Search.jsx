import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { searchApi } from '../../api/searchApi';
import VoterSlipModal from '../../components/VoterSlipModal';
import './Search.css';

// Hook to detect screen size
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

// Helper function to safely join name parts
const joinName = (...parts) => {
  return parts.filter(Boolean).join(' ').trim();
};

// Formatter for voter names (Marathi + English)
const formatVoterName = (voter) => {
  const marathi = joinName(
    voter.lFirstName,
    voter.lMiddleName,
    voter.lLastName
  );
  const english = joinName(
    voter.eFirstName,
    voter.eMiddleName,
    voter.eLastName
  );
  
  return {
    marathi: marathi || voter.lVoterName || '-', // Fallback to lVoterName if individual parts missing
    english: english || '-',
  };
};

const Search = () => {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [searchMode, setSearchMode] = useState('epic'); // 'epic' or 'name'
  const [epicId, setEpicId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [showVoterSlip, setShowVoterSlip] = useState(false);

  // Reset form when switching modes
  useEffect(() => {
    setEpicId('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setResults(null);
    setError('');
    setValidationError('');
  }, [searchMode]);

  const validateForm = () => {
    setValidationError('');
    
    if (searchMode === 'epic') {
      if (!epicId.trim()) {
        setValidationError('Please enter an EPIC number');
        return false;
      }
    } else {
      // Name search - at least one name field required
      if (!firstName.trim() && !middleName.trim() && !lastName.trim()) {
        setValidationError('Please enter at least one name field (First, Middle, or Last name)');
        return false;
      }
    }
    
    return true;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      let data;
      if (searchMode === 'epic') {
        // EPIC search - backend resolves candidate, prabhag, phone from JWT/session
        // Payload contains ONLY epicId (per Swagger: epicId field)
        data = await searchApi.searchByEpic({
          epicId: epicId.trim(),
        });
      } else {
        // Name search - backend resolves candidate, prabhag, phone from JWT/session
        // Build payload with only name fields (firstName, middleName, lastName)
        // Only include non-empty fields
        const namePayload = {};
        if (firstName.trim()) namePayload.firstName = firstName.trim();
        if (middleName.trim()) namePayload.middleName = middleName.trim();
        if (lastName.trim()) namePayload.lastName = lastName.trim();
        
        if (Object.keys(namePayload).length === 0) {
          setValidationError('Please enter at least one name field');
          setLoading(false);
          return;
        }

        data = await searchApi.searchByName(namePayload);
      }
      
      // Normalize response: handle both single object and array responses
      // API may return: { vcardid: "...", lVoterName: "..." } OR [{ vcardid: "...", ... }]
      console.log('Search API response:', data); // Temporary debug log
      
      // Normalize to array format
      let normalizedResults = [];
      if (Array.isArray(data)) {
        normalizedResults = data;
      } else if (data && typeof data === 'object') {
        // Single object response - wrap in array
        normalizedResults = [data];
      }
      
      setResults(normalizedResults);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You are not authorized or your number is not allow-listed.');
      } else if (err.response?.status === 404) {
        setError('Search service unavailable.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid search parameters.');
      } else {
        setError(err.response?.data?.message || 'Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Voter Search</h1>
          <p className="page-subtitle">Search for voter information using EPIC number or name</p>
        </div>
      </div>

      <div className="card">
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <strong>Note:</strong> Search context (candidate, prabhag, phone) is determined automatically for logged-in users.
        </div>

        {/* Search Mode Toggle */}
        <div className="search-mode-toggle" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Search Mode</label>
            <div className="radio-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label className="radio-option" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="searchMode"
                  value="epic"
                  checked={searchMode === 'epic'}
                  onChange={(e) => setSearchMode(e.target.value)}
                  disabled={loading}
                />
                <span style={{ fontWeight: searchMode === 'epic' ? 600 : 400 }}>
                  EPIC Number Wise
                </span>
              </label>
              <label className="radio-option" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="searchMode"
                  value="name"
                  checked={searchMode === 'name'}
                  onChange={(e) => setSearchMode(e.target.value)}
                  disabled={loading}
                />
                <span style={{ fontWeight: searchMode === 'name' ? 600 : 400 }}>
                  Name Wise
                </span>
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          {searchMode === 'epic' ? (
            /* EPIC Search Form */
            <div className="form-group">
              <label htmlFor="epic-id" className="form-label required">EPIC Number</label>
              <div className="search-input-group">
                <input
                  type="text"
                  id="epic-id"
                  className="form-input"
                  value={epicId}
                  onChange={(e) => setEpicId(e.target.value)}
                  placeholder="Enter EPIC ID (e.g. TBZ7632797)"
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !epicId.trim()}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              <div className="form-hint">
                Enter the voter's EPIC number to search. EPIC numbers are typically 10 characters (e.g., TBZ7632797).
              </div>
            </div>
          ) : (
            /* Name Search Form */
            <>
              <div className="name-search-grid">
                <div className="form-group">
                  <label htmlFor="first-name" className="form-label">First Name</label>
                  <input
                    type="text"
                    id="first-name"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="middle-name" className="form-label">Middle Name</label>
                  <input
                    type="text"
                    id="middle-name"
                    className="form-input"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Middle Name"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last-name" className="form-label">Last Name</label>
                  <input
                    type="text"
                    id="last-name"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <div className="search-input-group">
                  <div style={{ flex: 1 }}></div>
                  <button
                    type="submit"
                    disabled={loading || (!firstName.trim() && !middleName.trim() && !lastName.trim())}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
                <div className="form-hint">
                  Enter at least one name field (First, Middle, or Last name) to search. All fields are optional but at least one is required.
                </div>
              </div>
            </>
          )}

          {validationError && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              {validationError}
            </div>
          )}
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
            {error}
          </div>
        )}

        {results && results.length > 0 && (
          <div className="search-results" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Search Results</h3>
            {isMobile ? (
              /* Mobile Card Layout */
              <div className="search-results-mobile">
                {results.map((voter, index) => {
                  const name = formatVoterName(voter);
                  return (
                    <div key={index} className="voter-card">
                      <div className="voter-card-header">
                        <div className="voter-card-epic">
                          <span className="voter-card-label">EPIC No:</span>
                          <code className="voter-card-epic-value">{voter.vcardid || '-'}</code>
                        </div>
                      </div>
                      
                      <div className="voter-card-body">
                        <div className="voter-card-field">
                          <span className="voter-card-label">Voter Name:</span>
                          <div className="voter-card-name">
                            {name.marathi !== '-' && (
                              <div className="voter-card-name-marathi">{name.marathi}</div>
                            )}
                            {name.english !== '-' && (
                              <div className="voter-card-name-english">{name.english}</div>
                            )}
                            {name.marathi === '-' && name.english === '-' && (
                              <span>-</span>
                            )}
                          </div>
                        </div>

                        <div className="voter-card-row">
                          <div className="voter-card-field">
                            <span className="voter-card-label">Ward / Prabhag:</span>
                            <span className="voter-card-value">{voter.prabhag || '-'}</span>
                          </div>
                          <div className="voter-card-field">
                            <span className="voter-card-label">Booth / Yadibhag:</span>
                            <span className="voter-card-value">{voter.yadibhag || '-'}</span>
                          </div>
                        </div>

                        <div className="voter-card-field">
                          <span className="voter-card-label">SR No:</span>
                          <span className="voter-card-value">{voter.srno || '-'}</span>
                        </div>

                        <div className="voter-card-field">
                          <span className="voter-card-label">Booth Address:</span>
                          <div className="voter-card-address">{voter.lBoothaddress || '-'}</div>
                        </div>
                      </div>

                      <div className="voter-card-footer">
                        <button
                          onClick={() => {
                            setSelectedVoter(voter);
                            setShowVoterSlip(true);
                          }}
                          className="btn btn-primary voter-card-button"
                        >
                          View Voter Slip
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop Table Layout */
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>EPIC No</th>
                      <th>Voter Name</th>
                      <th>Ward / Prabhag</th>
                      <th>Booth / Yadibhag</th>
                      <th>SR No</th>
                      <th>Booth Address</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((voter, index) => {
                      const name = formatVoterName(voter);
                      return (
                        <tr key={index}>
                          <td>
                            <code>{voter.vcardid || '-'}</code>
                          </td>
                          <td>
                            <div style={{ lineHeight: '1.4' }}>
                              {name.marathi !== '-' && (
                                <div style={{ fontWeight: 500, fontFamily: 'inherit' }}>
                                  {name.marathi}
                                </div>
                              )}
                              {name.english !== '-' && (
                                <div style={{ fontSize: '0.85em', color: '#666', fontFamily: 'inherit' }}>
                                  {name.english}
                                </div>
                              )}
                              {name.marathi === '-' && name.english === '-' && (
                                <span>-</span>
                              )}
                            </div>
                          </td>
                          <td>{voter.prabhag || '-'}</td>
                          <td>{voter.yadibhag || '-'}</td>
                          <td>{voter.srno || '-'}</td>
                          <td style={{ fontFamily: 'inherit', maxWidth: '300px' }}>
                            {voter.lBoothaddress || '-'}
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setSelectedVoter(voter);
                                setShowVoterSlip(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              title="View Voter Slip"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {results && results.length === 0 && (
          <div className="search-results" style={{ marginTop: '2rem' }}>
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No voters found matching the criteria</div>
              <div className="empty-state-text">
                Try adjusting your search parameters.
              </div>
            </div>
          </div>
        )}

        {!results && !loading && (
          <div className="empty-state" style={{ marginTop: '2rem' }}>
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">Ready to Search</div>
            <div className="empty-state-text">
              {searchMode === 'epic' 
                ? 'Enter an EPIC number above to begin your search.'
                : 'Enter at least one name field above to begin your search.'}
            </div>
          </div>
        )}
      </div>

      {/* Voter Slip Modal */}
      <VoterSlipModal
        isOpen={showVoterSlip}
        onClose={() => {
          setShowVoterSlip(false);
          setSelectedVoter(null);
        }}
        voter={selectedVoter}
      />
    </div>
  );
};

export default Search;
