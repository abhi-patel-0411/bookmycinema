import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Table, Button, Modal, ListGroup } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaGlobe, 
  FaClock, 
  FaParking, 
  FaUtensils, 
  FaWheelchair, 
  FaSnowflake, 
  FaWifi,
  FaTv,
  FaUsers,
  FaStar,
  FaEdit,
  FaEye
} from 'react-icons/fa';
import theatersAPI from '../../services/api/theatersAPI';

const TheaterDetails = ({ theaterId, show, onHide, onEdit }) => {
  const [theater, setTheater] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (theaterId && show) {
      fetchTheaterDetails();
    }
  }, [theaterId, show]);

  const fetchTheaterDetails = async () => {
    try {
      setLoading(true);
      const response = await theatersAPI.getById(theaterId);
      setTheater(response.data);
    } catch (error) {
      console.error('Failed to fetch theater details');
    } finally {
      setLoading(false);
    }
  };

  if (!theater) {
    return (
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Body className="text-center py-5" style={{ background: 'var(--card-bg)' }}>
          {loading ? (
            <div className="text-white">Loading theater details...</div>
          ) : (
            <div className="text-secondary">Theater not found</div>
          )}
        </Modal.Body>
      </Modal>
    );
  }

  const getFacilityIcon = (facility) => {
    const icons = {
      parking: FaParking,
      foodCourt: FaUtensils,
      wheelchairAccess: FaWheelchair,
      airConditioning: FaSnowflake,
      wifi: FaWifi
    };
    return icons[facility] || FaUsers;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="border-0" style={{ background: 'var(--card-bg)' }}>
        <Modal.Title className="text-white d-flex align-items-center">
          <FaEye className="me-2" />
          Theater Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: 'var(--card-bg)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header Section */}
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h2 className="text-white mb-2">{theater.name}</h2>
                  <div className="d-flex gap-2 mb-3">
                    <Badge bg={theater.status?.isActive !== false ? "success" : "danger"}>
                      {theater.status?.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                    {theater.status?.isVerified && <Badge bg="primary">Verified</Badge>}
                    {theater.status?.maintenanceMode && <Badge bg="warning">Maintenance</Badge>}
                  </div>
                </div>
                <div className="text-end">
                  {theater.ratings?.average > 0 && (
                    <div className="d-flex align-items-center mb-2">
                      <FaStar className="text-warning me-1" />
                      <span className="text-white me-2">{theater.ratings.average.toFixed(1)}</span>
                      <small className="text-secondary">({theater.ratings.totalReviews} reviews)</small>
                    </div>
                  )}
                  <Button variant="outline-primary" size="sm" onClick={() => onEdit && onEdit(theater)}>
                    <FaEdit className="me-1" />Edit Theater
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            {/* Basic Information */}
            <Col md={6}>
              <Card className="border-0 shadow-sm mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Card.Header className="border-0 bg-transparent">
                  <h5 className="text-white mb-0">
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    Location & Contact
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong className="text-white">Address:</strong>
                    <p className="text-secondary mb-1">{theater.location}</p>
                    {theater.address && (
                      <div className="small text-secondary">
                        {theater.address.area && <div>{theater.address.area}</div>}
                        {theater.address.city && <div>{theater.address.city}, {theater.address.state}</div>}
                        {theater.address.pincode && <div>PIN: {theater.address.pincode}</div>}
                        {theater.address.landmark && <div>Near: {theater.address.landmark}</div>}
                      </div>
                    )}
                  </div>

                  {theater.contactInfo && (
                    <div>
                      {theater.contactInfo.phone && (
                        <div className="d-flex align-items-center mb-2">
                          <FaPhone className="text-primary me-2" size={14} />
                          <span className="text-white">{theater.contactInfo.phone}</span>
                        </div>
                      )}
                      {theater.contactInfo.email && (
                        <div className="d-flex align-items-center mb-2">
                          <FaEnvelope className="text-primary me-2" size={14} />
                          <span className="text-white">{theater.contactInfo.email}</span>
                        </div>
                      )}
                      {theater.contactInfo.website && (
                        <div className="d-flex align-items-center mb-2">
                          <FaGlobe className="text-primary me-2" size={14} />
                          <a href={theater.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-primary">
                            {theater.contactInfo.website}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {theater.operatingHours && (
                    <div className="mt-3">
                      <strong className="text-white d-flex align-items-center mb-2">
                        <FaClock className="me-2 text-primary" size={14} />
                        Operating Hours
                      </strong>
                      <div className="small text-secondary">
                        <div>Weekdays: {theater.operatingHours.weekdays?.open} - {theater.operatingHours.weekdays?.close}</div>
                        <div>Weekends: {theater.operatingHours.weekends?.open} - {theater.operatingHours.weekends?.close}</div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Facilities & Amenities */}
            <Col md={6}>
              <Card className="border-0 shadow-sm mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Card.Header className="border-0 bg-transparent">
                  <h5 className="text-white mb-0">Facilities & Amenities</h5>
                </Card.Header>
                <Card.Body>
                  {theater.facilities && (
                    <div className="mb-3">
                      <strong className="text-white mb-2 d-block">Facilities:</strong>
                      <Row>
                        {Object.entries(theater.facilities).map(([key, value]) => {
                          if (key === 'parking' && value?.available) {
                            return (
                              <Col xs={6} key={key} className="mb-2">
                                <div className="d-flex align-items-center">
                                  <FaParking className="text-success me-2" size={16} />
                                  <small className="text-white">
                                    Parking ({value.capacity} spaces)
                                  </small>
                                </div>
                              </Col>
                            );
                          } else if (typeof value === 'boolean' && value) {
                            const IconComponent = getFacilityIcon(key);
                            return (
                              <Col xs={6} key={key} className="mb-2">
                                <div className="d-flex align-items-center">
                                  <IconComponent className="text-success me-2" size={16} />
                                  <small className="text-white">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                  </small>
                                </div>
                              </Col>
                            );
                          }
                          return null;
                        })}
                      </Row>
                    </div>
                  )}

                  {theater.amenities && theater.amenities.length > 0 && (
                    <div>
                      <strong className="text-white mb-2 d-block">Amenities:</strong>
                      <div className="d-flex flex-wrap gap-1">
                        {theater.amenities.map((amenity, index) => (
                          <Badge key={index} bg="secondary" className="mb-1">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Screens Information */}
          {theater.screens && theater.screens.length > 0 && (
            <Card className="border-0 shadow-sm mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Card.Header className="border-0 bg-transparent">
                <h5 className="text-white mb-0">
                  <FaTv className="me-2 text-primary" />
                  Screens ({theater.screens.length})
                </h5>
              </Card.Header>
              <Card.Body>
                <Table responsive variant="dark" className="mb-0">
                  <thead>
                    <tr>
                      <th>Screen</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Sound</th>
                      <th>Projection</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {theater.screens.map((screen, index) => (
                      <tr key={index}>
                        <td>#{screen.screenNumber}</td>
                        <td>{screen.name}</td>
                        <td>
                          <Badge bg="info">{screen.screenType}</Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaUsers className="me-1" size={12} />
                            {screen.capacity}
                          </div>
                        </td>
                        <td>{screen.soundSystem}</td>
                        <td>{screen.projectionType}</td>
                        <td>
                          <Badge bg={screen.isActive ? "success" : "danger"}>
                            {screen.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Pricing & Statistics */}
          <Row>
            <Col md={6}>
              {theater.pricing && (
                <Card className="border-0 shadow-sm mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Card.Header className="border-0 bg-transparent">
                    <h5 className="text-white mb-0">Pricing Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush" className="bg-transparent">
                      <ListGroup.Item className="bg-transparent border-secondary text-white d-flex justify-content-between">
                        <span>Base Price:</span>
                        <strong>₹{theater.pricing.basePrice}</strong>
                      </ListGroup.Item>
                      <ListGroup.Item className="bg-transparent border-secondary text-white d-flex justify-content-between">
                        <span>Premium Price:</span>
                        <strong>₹{theater.pricing.premiumPrice}</strong>
                      </ListGroup.Item>
                      <ListGroup.Item className="bg-transparent border-secondary text-white d-flex justify-content-between">
                        <span>Weekend Surcharge:</span>
                        <strong>₹{theater.pricing.weekendSurcharge}</strong>
                      </ListGroup.Item>
                      {theater.pricing.holidaySurcharge && (
                        <ListGroup.Item className="bg-transparent border-secondary text-white d-flex justify-content-between">
                          <span>Holiday Surcharge:</span>
                          <strong>₹{theater.pricing.holidaySurcharge}</strong>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>
              )}
            </Col>
            <Col md={6}>
              {theater.metadata && (
                <Card className="border-0 shadow-sm mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Card.Header className="border-0 bg-transparent">
                    <h5 className="text-white mb-0">Statistics</h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush" className="bg-transparent">
                      <ListGroup.Item className="bg-transparent border-secondary text-white d-flex justify-content-between">
                        <span>Total Shows:</span>
                        <strong>{theater.metadata.totalShows || 0}</strong>
                      </ListGroup.Item>
                      <ListGroup.Item className="bg-transparent border-secondary text-white d-flex justify-content-between">
                        <span>Total Bookings:</span>
                        <strong>{theater.metadata.totalBookings || 0}</strong>
                      </ListGroup.Item>
                      <ListGroup.Item className="bg-transparent border-secondary text-white d-flex justify-content-between">
                        <span>Revenue:</span>
                        <strong>₹{theater.metadata.revenue?.toLocaleString() || 0}</strong>
                      </ListGroup.Item>
                      {theater.metadata.lastShowDate && (
                        <ListGroup.Item className="bg-transparent border-secondary text-white d-flex justify-content-between">
                          <span>Last Show:</span>
                          <strong>{new Date(theater.metadata.lastShowDate).toLocaleDateString()}</strong>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </motion.div>
      </Modal.Body>
      <Modal.Footer className="border-0" style={{ background: 'var(--card-bg)' }}>
        <Button variant="outline-secondary" onClick={onHide}>Close</Button>
        {onEdit && (
          <Button variant="primary" onClick={() => onEdit(theater)}>
            <FaEdit className="me-1" />Edit Theater
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default TheaterDetails;