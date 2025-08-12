import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCalendarAlt, FaClock, FaBuilding, FaFilm, FaRupeeSign } from 'react-icons/fa';
import { motion } from 'framer-motion';
import moment from 'moment';

const AdminShowCard = ({ show, onEdit, onDelete, index }) => {
  const formatDate = (date) => {
    return moment(date).format('MMM DD');
  };

  const formatTime = (time) => {
    return moment(`2000-01-01T${time}`).format('h:mm A');
  };

  const isPastShow = (show) => {
    const now = new Date();
    const showDateTime = new Date(show.showDate);
    const [hours, minutes] = show.showTime.split(':');
    showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return now > showDateTime;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card className="h-100 bg-dark border-bottom border-secondary">
        <Card.Header className="d-flex align-items-start gap-3 border-bottom border-secondary">
          <div className="position-relative">
            <img
              src={show.movie?.poster || `https://via.placeholder.com/60x80/1e293b/ffffff?text=${show.movie?.title?.charAt(0) || 'M'}`}
              alt={show.movie?.title}
              className="rounded"
              style={{ width: '50px', height: '70px', objectFit: 'cover' }}
            />
            <Badge bg={isPastShow(show) ? 'secondary' : 'success'} 
                  className="position-absolute"
                  style={{ top: '-5px', right: '-5px', fontSize: '0.6rem' }}>
              {isPastShow(show) ? 'Past' : 'Live'}
            </Badge>
          </div>
          
          <div className="flex-grow-1 overflow-hidden">
            <h6 className="text-white mb-1 text-truncate">{show.movie?.title || 'Unknown Movie'}</h6>
            <div className="d-flex flex-wrap gap-1">
              {show.movie?.genre?.slice(0, 2).map((genre, i) => (
                <span key={i} className="badge bg-secondary text-white" style={{ fontSize: '0.65rem' }}>{genre}</span>
              ))}
            </div>
          </div>
          
          <div className="d-flex gap-1">
            <Button size="sm" variant="outline-primary" onClick={() => onEdit(show)}>
              <FaEdit size={12} />
            </Button>
            <Button size="sm" variant="outline-danger" onClick={() => onDelete(show._id, show.movie?.title)} title="Delete Show">
              <FaTrash size={12} />
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body className="p-3">
          <div className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <FaBuilding className="text-primary me-2" size={12} />
              <div>
                <div className="text-white" style={{ fontSize: '0.85rem' }}>{show.theater?.name || 'Unknown'}</div>
                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{show.theater?.city || show.theater?.location || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div className="d-flex flex-wrap gap-3 mb-3">
            <div className="d-flex align-items-center">
              <FaCalendarAlt className="text-primary me-2" size={12} />
              <span className="text-white" style={{ fontSize: '0.8rem' }}>{formatDate(show.showDate)}</span>
            </div>
            <div className="d-flex align-items-center">
              <FaClock className="text-primary me-2" size={12} />
              <span className="text-white" style={{ fontSize: '0.8rem' }}>{formatTime(show.showTime)}</span>
            </div>
            <div className="d-flex align-items-center">
              <FaFilm className="text-primary me-2" size={12} />
              <span className="text-white" style={{ fontSize: '0.8rem' }}>Screen {show.screenNumber || 1}</span>
            </div>
          </div>
          
          <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
            <div className="d-flex align-items-center">
              <FaRupeeSign className="text-success me-1" size={12} />
              <span className="text-success fw-bold" style={{ fontSize: '0.9rem' }}>₹{show.pricing?.silver || show.price}</span>
            </div>
            <div className="d-flex gap-1">
              <Badge bg="info" style={{ fontSize: '0.65rem' }}>S:₹{show.pricing?.silver || show.price}</Badge>
              <Badge bg="warning" style={{ fontSize: '0.65rem' }}>G:₹{show.pricing?.gold || Math.round(show.price * 1.3)}</Badge>
              <Badge bg="danger" style={{ fontSize: '0.65rem' }}>P:₹{show.pricing?.premium || Math.round(show.price * 1.8)}</Badge>
            </div>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default AdminShowCard;