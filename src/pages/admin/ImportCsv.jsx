import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../components/Toast';
import Modal from '../../components/Modal';
import './Admin.css';

const ImportCsv = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [recentImports, setRecentImports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [importToDelete, setImportToDelete] = useState(null);

  // Note: Backend doesn't provide a GET endpoint for import history
  // This is a placeholder - would need backend API to list imports
  useEffect(() => {
    // TODO: Add GET /api/imports endpoint if backend provides it
    // For now, we'll track imports in component state
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setCsvFile(file);
      setImportResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setUploading(true);
    try {
      const result = await adminApi.importCsv(csvFile);
      setImportResult(result);
      
      // Note: Backend import response doesn't include importId
      // To properly track imports for deletion, backend would need to:
      // 1. Return importId in CsvImportResultDto, OR
      // 2. Provide GET /api/imports endpoint to list imports
      // For now, we track locally but delete won't work without actual importId
      if (result.importId) {
        const newImport = {
          importId: result.importId,
          filename: csvFile.name,
          uploadedAt: new Date().toISOString(),
          totalRows: result.totalRows || 0,
          successCount: result.successCount || 0,
          rejectedCount: result.rejectedCount || 0,
        };
        setRecentImports([newImport, ...recentImports]);
      }
      
      toast.success(`CSV imported successfully. ${result.successCount || 0} rows imported, ${result.rejectedCount || 0} rejected.`);
      setCsvFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error(err.response?.data?.message || 'Invalid CSV file');
      } else {
        toast.error('Failed to import CSV file');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (importId) => {
    try {
      await adminApi.deleteImport(importId);
      toast.success('Import deleted successfully');
      setRecentImports(recentImports.filter(imp => imp.importId !== importId));
      setShowDeleteModal(false);
      setImportToDelete(null);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Import not found');
      } else {
        toast.error('Failed to delete import');
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL imports? This action cannot be undone.')) {
      return;
    }

    try {
      await adminApi.deleteAllImports();
      toast.success('All imports deleted successfully');
      setRecentImports([]);
    } catch (err) {
      toast.error('Failed to delete all imports');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>CSV Import</h1>
          <p className="page-subtitle">
            Upload and import voter data from CSV files
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Upload CSV File</h3>
        </div>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label className="form-label required">CSV File</label>
            <input
              type="file"
              accept=".csv"
              className="form-input"
              onChange={handleFileChange}
              required
              disabled={uploading}
            />
            <div className="form-hint">
              Select a CSV file containing voter data. The file should have proper headers and data format.
            </div>
          </div>

          {importResult && (
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <strong>Import Summary:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                <li>Total Rows: {importResult.totalRows || 0}</li>
                <li>Successfully Imported: {importResult.successCount || 0}</li>
                <li>Rejected: {importResult.rejectedCount || 0}</li>
              </ul>
              {importResult.rejectedRows && importResult.rejectedRows.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <strong>Rejected Rows:</strong>
                  <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                    {importResult.rejectedRows.slice(0, 5).map((row, idx) => (
                      <li key={idx}>
                        Line {row.lineNumber}: {row.reason} (vcardid: {row.vcardid})
                      </li>
                    ))}
                    {importResult.rejectedRows.length > 5 && (
                      <li>... and {importResult.rejectedRows.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="modal-footer" style={{ padding: 0, borderTop: 'none', marginTop: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !csvFile}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                '📤 Upload CSV'
              )}
            </button>
          </div>
        </form>
      </div>

      {recentImports.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Imports ({recentImports.length})</h3>
            <button
              onClick={handleDeleteAll}
              className="btn btn-danger btn-sm"
            >
              Delete All
            </button>
          </div>
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <strong>Note:</strong> Import history is tracked locally. To enable delete functionality, 
            backend needs to return importId in the import response or provide a GET endpoint to list imports.
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Import ID</th>
                  <th>Filename</th>
                  <th>Uploaded At</th>
                  <th>Total Rows</th>
                  <th>Success</th>
                  <th>Rejected</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentImports.map((imp) => (
                  <tr key={imp.importId}>
                    <td><code>{imp.importId}</code></td>
                    <td>{imp.filename}</td>
                    <td>{new Date(imp.uploadedAt).toLocaleString()}</td>
                    <td>{imp.totalRows}</td>
                    <td>
                      <span className="badge badge-success">{imp.successCount}</span>
                    </td>
                    <td>
                      <span className="badge badge-danger">{imp.rejectedCount}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setImportToDelete(imp.importId);
                          setShowDeleteModal(true);
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentImports.length === 0 && !uploading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No Recent Imports</div>
            <div className="empty-state-text">
              Upload a CSV file above to import voter data.
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setImportToDelete(null);
        }}
        title="Delete Import"
        size="small"
      >
        <p>Are you sure you want to delete this import? This action cannot be undone.</p>
        <div className="modal-footer">
          <button
            type="button"
            onClick={() => {
              setShowDeleteModal(false);
              setImportToDelete(null);
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleDelete(importToDelete)}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ImportCsv;

