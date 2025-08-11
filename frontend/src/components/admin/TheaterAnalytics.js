import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, ProgressBar } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaBuilding, FaTv, FaUsers, FaStar, FaMapMarkerAlt, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';
import theatersAPI from '../../services/api/theatersAPI';

const TheaterAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await theatersAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return <div className="text-center text-white">Loading analytics...</div>;
  }

  const { overview, cityStats } = analytics;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="text-white mb-4">Theater Analytics Dashboard</h3>
      
      {/* Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-lg bg-gradient-primary text-white">
            <Card.Body className="text-center">
              <FaBuilding size={32} className="mb-3" />
              <h2 className="mb-1">{overview?.totalTheaters || 0}</h2>
              <p className="mb-0">Total Theaters</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-lg bg-gradient-success text-white">
            <Card.Body className="text-center">
              <FaTv size={32} className="mb-3" />
              <h2 className="mb-1">{overview?.totalScreens || 0}</h2>
              <p className="mb-0">Total Screens</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-lg bg-gradient-info text-white">
            <Card.Body className="text-center">
              <FaUsers size={32} className="mb-3" />
              <h2 className="mb-1">{overview?.totalCapacity?.toLocaleString() || 0}</h2>
              <p className="mb-0">Total Capacity</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-lg bg-gradient-warning text-white">
            <Card.Body className="text-center">
              <FaStar size={32} className="mb-3" />
              <h2 className="mb-1">{overview?.avgRating?.toFixed(1) || '0.0'}</h2>
              <p className="mb-0">Average Rating</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Revenue and Bookings */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-lg" style={{ background: 'var(--card-bg)' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <FaMoneyBillWave className="text-success me-2" size={20} />
                <h5 className="text-white mb-0">Total Revenue</h5>
              </div>
              <h2 className="text-success mb-2">
                ₹{overview?.totalRevenue?.toLocaleString() || 0}
              </h2>
              <small className="text-secondary">Across all theaters</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-lg" style={{ background: 'var(--card-bg)' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <FaChartLine className="text-primary me-2" size={20} />
                <h5 className="text-white mb-0">Total Bookings</h5>
              </div>
              <h2 className="text-primary mb-2">
                {overview?.totalBookings?.toLocaleString() || 0}
              </h2>
              <small className="text-secondary">All time bookings</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* City-wise Statistics */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card-bg)' }}>
        <Card.Header className="border-0" style={{ background: 'var(--card-bg)' }}>
          <div className="d-flex align-items-center">
            <FaMapMarkerAlt className="text-primary me-2" />
            <h5 className="text-white mb-0">City-wise Theater Distribution</h5>
          </div>
        </Card.Header>
        <Card.Body>
          {cityStats && cityStats.length > 0 ? (
            <Table responsive variant="dark" className="mb-0">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Theaters</th>
                  <th>Total Capacity</th>
                  <th>Avg Rating</th>
                  <th>Market Share</th>
                </tr>
              </thead>
              <tbody>
                {cityStats.map((city, index) => {
                  const marketShare = ((city.count / overview?.totalTheaters) * 100) || 0;
                  return (
                    <tr key={city._id || index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <Badge bg="primary" className="me-2">{index + 1}</Badge>
                          {city._id || 'Unknown'}
                        </div>
                      </td>
                      <td>
                        <Badge bg="success">{city.count}</Badge>
                      </td>
                      <td>{city.totalCapacity?.toLocaleString() || 0}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaStar className="text-warning me-1" size={12} />
                          {city.avgRating?.toFixed(1) || '0.0'}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <ProgressBar 
                            now={marketShare} 
                            className="flex-grow-1 me-2" 
                            style={{ height: '8px' }}
                            variant="info"
                          />
                          <small>{marketShare.toFixed(1)}%</small>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-secondary py-4">
              <FaMapMarkerAlt size={48} className="mb-3 opacity-50" />
              <p>No city data available</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default TheaterAnalytics;