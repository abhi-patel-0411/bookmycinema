import React, { useState, useEffect } from 'react';
import { Dropdown, Button, Badge } from 'react-bootstrap';
import { FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import api from '../../services/api';

const CitySelector = ({ selectedCity, onCityChange, className = '' }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await api.get('/shows/cities/list');
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
      // Fallback cities if API fails
      setCities(['Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad']);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city) => {
    onCityChange(city);
  };

  if (loading) {
    return (
      <Button variant="outline-light" disabled className={className}>
        <FaMapMarkerAlt className="me-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Dropdown className={className}>
      <Dropdown.Toggle 
        variant="outline-light" 
        className="d-flex align-items-center"
        style={{ minWidth: '150px' }}
      >
        <FaMapMarkerAlt className="me-2" />
        {selectedCity || 'Select City'}
        {selectedCity && (
          <Badge bg="primary" className="ms-2">
            <FaCheck size={10} />
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu 
        className="shadow-lg border-0"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: '300px',
          overflowY: 'auto'
        }}
      >
        <Dropdown.Header className="text-white fw-bold">
          Select Your City
        </Dropdown.Header>
        
        {selectedCity && (
          <>
            <motion.div
              whileHover={{ backgroundColor: 'rgba(229, 9, 20, 0.1)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Dropdown.Item
                onClick={() => handleCitySelect(null)}
                className="text-secondary d-flex align-items-center"
                style={{ backgroundColor: 'transparent' }}
              >
                <FaMapMarkerAlt className="me-2" />
                All Cities
              </Dropdown.Item>
            </motion.div>
            <Dropdown.Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          </>
        )}

        {cities.map((city) => (
          <motion.div
            key={city}
            whileHover={{ backgroundColor: 'rgba(229, 9, 20, 0.1)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Dropdown.Item
              onClick={() => handleCitySelect(city)}
              className={`d-flex align-items-center justify-content-between ${
                selectedCity === city ? 'text-primary' : 'text-white'
              }`}
              style={{ backgroundColor: 'transparent' }}
            >
              <div className="d-flex align-items-center">
                <FaMapMarkerAlt className="me-2" />
                {city}
              </div>
              {selectedCity === city && (
                <FaCheck className="text-primary" size={12} />
              )}
            </Dropdown.Item>
          </motion.div>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default CitySelector;