import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa';

const EmptyShowsState = ({ onRetry }) => {
  return (
    <Card className="admin-card">
      <Card.Body className="p-5 text-center">
        <div className="empty-state">
          <FaCalendarAlt className="empty-state-icon mb-3" size={50} />
          <h4 className="text-white">No Shows Found</h4>
          <p className="text-secondary mb-4">There are no shows available or there was an error loading them.</p>
          <Button 
            variant="primary" 
            onClick={onRetry}
            className="px-4 py-2"
          >
            Retry Loading Shows
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EmptyShowsState;