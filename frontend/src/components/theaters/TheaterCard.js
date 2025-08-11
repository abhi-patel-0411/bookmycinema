import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPhone, FaDesktop, FaStar, FaEye, FaWifi, FaParking, FaCoffee, FaRestroom } from 'react-icons/fa';
import { motion } from 'framer-motion';

const TheaterCard = ({ theater, index }) => {
  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <FaWifi className="me-1" />;
      case 'parking': return <FaParking className="me-1" />;
      case 'food court': case 'cafeteria': return <FaCoffee className="me-1" />;
      case 'restroom': case 'washroom': return <FaRestroom className="me-1" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
      className="theater-card-container"
    >
      <Card className="h-100 bg-dark border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="position-relative">
          <div className="theater-banner" style={{ 
            height: '80px', 
            background: 'linear-gradient(135deg, #e63946, #f84565)', 
            opacity: 0.8 
          }}></div>
          <div className="position-absolute" style={{ top: '15px', left: '15px' }}>
            <div className="theater-icon bg-dark d-flex align-items-center justify-content-center" 
                 style={{ width: '50px', height: '50px', borderRadius: '50%', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
              <FaFilm className="text-danger" size={20} />
            </div>
          </div>
          {theater.ratings?.average > 0 && (
            <div className="position-absolute" style={{ top: '15px', right: '15px' }}>
              <div className="d-flex align-items-center bg-dark px-2 py-1 rounded-pill">
                <FaStar className="text-warning me-1" />
                <span className="text-white fw-bold">{theater.ratings.average.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
        
        <Card.Body className="p-3">
          <h5 className="text-white fw-bold mb-2">{theater.name}</h5>
          <div className="d-flex align-items-center text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
            <FaMapMarkerAlt className="me-2 text-danger" />
            <span>{theater.location || theater.address?.street || 'Location not specified'}</span>
          </div>

          {/* Amenities */}
          {theater.amenities && theater.amenities.length > 0 && (
            <div className="d-flex flex-wrap gap-1 mb-3">
              {theater.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} bg="secondary" className="d-flex align-items-center px-2 py-1" style={{ fontSize: '0.7rem' }}>
                  {getAmenityIcon(amenity)}
                  {amenity}
                </Badge>
              ))}
              {theater.amenities.length > 3 && (
                <Badge bg="secondary" className="px-2 py-1" style={{ fontSize: '0.7rem' }}>
                  +{theater.amenities.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Screens Summary */}
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaDesktop className="me-2 text-primary" />
              <span className="text-white">{theater.screens?.length || 0} Screens</span>
            </div>
            <Button variant="outline-danger" size="sm" className="rounded-pill" style={{ fontSize: '0.75rem' }}>
              View Details
            </Button>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default TheaterCard;