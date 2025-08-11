import React, { useState } from 'react';
import { Button, Card, Alert } from 'react-bootstrap';
import { FaTrash, FaSync, FaFilm, FaCalendarAlt } from 'react-icons/fa';
import api from '../../services/api';

const CleanupPastShows = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCleanup = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      // Call the cleanup endpoint
      const response = await api.post('/admin/cleanup');
      
      setResult({
        deletedShows: response.data.deletedShows,
        deactivatedMovies: response.data.deactivatedMovies,
        message: response.data.message
      });
    } catch (err) {
      console.error('Error running cleanup:', err);
      setError(err.response?.data?.message || 'Failed to run cleanup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4 border-0 shadow-sm">
      <Card.Header className="bg-dark text-white">
        <h5 className="mb-0">
          <FaTrash className="me-2" /> Database Cleanup
        </h5>
      </Card.Header>
      <Card.Body>
        <p>
          This will permanently delete all past shows and deactivate movies with no remaining shows.
          This action cannot be undone.
        </p>
        
        {result && (
          <Alert variant="success" className="mb-3">
            <strong>Success!</strong> {result.deletedShows} past shows were deleted and {result.deactivatedMovies} movies were deactivated.
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger" className="mb-3">
            <strong>Error:</strong> {error}
          </Alert>
        )}
        
        <Button 
          variant="danger" 
          onClick={handleCleanup} 
          disabled={loading}
          className="d-flex align-items-center"
        >
          {loading ? (
            <>
              <FaSync className="me-2 fa-spin" /> Running cleanup...
            </>
          ) : (
            <>
              <FaTrash className="me-2" /> Run Full Cleanup
            </>
          )}
        </Button>
      </Card.Body>
      <Card.Footer className="bg-light text-muted">
        <small>
          <div><FaCalendarAlt className="me-1" /> Past shows are automatically deleted when they expire</div>
          <div><FaFilm className="me-1" /> Movies with no shows are automatically deactivated</div>
        </small>
      </Card.Footer>
    </Card>
  );
};

export default CleanupPastShows;