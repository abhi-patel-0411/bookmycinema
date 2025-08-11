import React, { useState } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { FaSync, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../services/api';

const SyncClerkUsers = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSync = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await api.post('/auth-sync/sync-clerk-users');
      setResult(response.data);
    } catch (err) {
      console.error('Error syncing Clerk users:', err);
      setError(err.response?.data?.message || 'Failed to sync Clerk users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center mb-3">
        <Button 
          variant="primary" 
          onClick={handleSync} 
          disabled={loading}
          className="d-flex align-items-center"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Syncing Users...
            </>
          ) : (
            <>
              <FaSync className="me-2" />
              Sync Clerk Users
            </>
          )}
        </Button>
        <small className="text-muted ms-3">
          Manually sync users from Clerk to the database
        </small>
      </div>
      
      {error && (
        <Alert variant="danger" className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}
      
      {result && (
        <Alert variant="success">
          <div className="d-flex align-items-center mb-2">
            <FaCheck className="me-2" />
            <strong>{result.message}</strong>
          </div>
          <div className="small">
            <div>Total users: {result.stats.total}</div>
            <div>Created: {result.stats.created}</div>
            <div>Updated: {result.stats.updated}</div>
            <div>Skipped: {result.stats.skipped}</div>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default SyncClerkUsers;