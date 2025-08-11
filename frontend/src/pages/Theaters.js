import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FaSearch, FaMapMarkerAlt, FaFilm, FaChevronRight, FaTicketAlt, FaStar, FaUsers, FaPlay, FaCalendarAlt, FaFilter, FaBuilding } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AOS from 'aos';
import ModernLoader from '../components/common/ModernLoader';
import api from '../services/api';
import showsAPI from '../services/api/showsAPI';

const Theaters = () => {
  const navigate = useNavigate();
  const [theaters, setTheaters] = useState([]);
  const [filteredTheaters, setFilteredTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [theaterMovies, setTheaterMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetchTheaters();
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    filterTheaters();
  }, [theaters, searchTerm, selectedCity]);

  const fetchTheaters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/theaters');
      const theatersData = Array.isArray(response.data) ? response.data : response.data.theaters || [];
      
      setTheaters(theatersData);
      const uniqueCities = [...new Set(theatersData.map(t => t.address?.city || t.city).filter(Boolean))];
      setCities(uniqueCities);
    } catch (error) {
      console.error('Fetch theaters error:', error);
      toast.error('Failed to fetch theaters');
    } finally {
      setLoading(false);
    }
  };

  const filterTheaters = () => {
    let filtered = theaters.filter(theater => theater.status?.isActive !== false);

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(theater =>
        theater.name?.toLowerCase().includes(search) ||
        theater.location?.toLowerCase().includes(search) ||
        theater.address?.city?.toLowerCase().includes(search)
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(theater => 
        (theater.address?.city || theater.city) === selectedCity
      );
    }

    setFilteredTheaters(filtered);
  };

  const handleTheaterClick = async (theater) => {
    setSelectedTheater(theater);
    setLoadingMovies(true);
    
    try {
      const response = await showsAPI.getShowsByTheater(theater._id);
      const shows = response.data || [];
      
      const currentTime = new Date();
      const futureShows = shows.filter(show => {
        if (!show.showDate || !show.showTime) return false;
        
        const showDateTime = new Date(show.showDate);
        const [hours, minutes] = show.showTime.split(':');
        showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        
        return showDateTime > currentTime;
      });
      
      const movieMap = {};
      futureShows.forEach(show => {
        if (show.movie && show.theater && show.theater._id === theater._id) {
          const movieId = show.movie._id;
          if (!movieMap[movieId]) {
            movieMap[movieId] = {
              ...show.movie,
              shows: []
            };
          }
          movieMap[movieId].shows.push({
            id: show._id,
            showTime: show.showTime,
            showDate: show.showDate,
            price: show.price,
            screenNumber: show.screenNumber
          });
        }
      });
      
      setTheaterMovies(Object.values(movieMap));
      
      if (theater.address?.city || theater.city) {
        localStorage.setItem('selectedTheaterCity', theater.address?.city || theater.city);
      }
    } catch (error) {
      console.error('Error fetching theater movies:', error);
      toast.error('Failed to load movies for this theater');
      setTheaterMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const handleBackToTheaters = () => {
    setSelectedTheater(null);
    setTheaterMovies([]);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0f1419' }}>
        <ModernLoader text="Loading Theaters" />
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#1f2025', paddingTop: '80px', paddingBottom: '50px' }}>
      <Container fluid="xl">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-5"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="d-flex align-items-center justify-content-center mb-3">
            <div className="p-3 rounded-circle me-3" style={{ background: 'linear-gradient(135deg, #e50914, #ff4757)' }}>
              <FaBuilding size={32} className="text-white" />
            </div>
            <h1 className="display-5 fw-bold text-white mb-0">Premium Theaters</h1>
          </div>
          <p className="fs-6 text-light mb-0" style={{ maxWidth: '600px', margin: '0 auto', opacity: 0.8 }}>
            Discover world-class cinemas with cutting-edge technology and premium experiences
          </p>
        </motion.div>

        {/* Search & Filter Section */}
        {!selectedTheater && (
          <motion.div 
            className="mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Card.Body className="p-3">
                <Row className="g-4">
                  <Col lg={6}>
                    <Form.Group>
                      <Form.Label className="text-white fw-semibold mb-2 d-flex align-items-center">
                        <FaSearch className="me-2 text-light" /> Search Theaters
                      </Form.Label>
                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-dark text-light border-0">
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search by name or location..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="text-white border-0"
                          style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)' }}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col lg={4}>
                    <Form.Group>
                      <Form.Label className="text-white fw-semibold mb-2 d-flex align-items-center">
                        <FaMapMarkerAlt className="me-2 text-light" /> Select City
                      </Form.Label>
                      <Form.Select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="text-white border-0"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)' }}
                      >
                        <option value="">All Cities</option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={2} className="d-flex align-items-end">
                    <Button
                      variant="outline-light"
                      className="w-100"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCity('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </motion.div>
        )}

        {/* Back Button */}
        {selectedTheater && (
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="outline-light"
              size="lg"
              className="d-flex align-items-center"
              style={{ borderRadius: '16px', fontFamily: 'Inter, sans-serif' }}
              onClick={handleBackToTheaters}
            >
              <FaChevronRight className="me-2" style={{ transform: 'rotate(180deg)' }} />
              Back to All Theaters
            </Button>
          </motion.div>
        )}

        {/* Results Header */}
        {!selectedTheater && (
          <motion.div 
            className="d-flex align-items-center justify-content-between mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="d-flex align-items-center">
              <div className="me-3 p-3 rounded-circle" style={{ backgroundColor: '#343a40' }}>
                <FaBuilding className="text-white" size={20} />
              </div>
              <div>
                <h4 className="text-white mb-1 fw-bold">
                  {filteredTheaters.length} Theater{filteredTheaters.length !== 1 ? 's' : ''} Found
                </h4>
                {selectedCity && (
                  <p className="text-light mb-0">
                    <FaMapMarkerAlt className="me-1" /> in {selectedCity}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Theater Cards Grid */}
        {!selectedTheater && (
          <Row className="g-3">
            <AnimatePresence>
              {filteredTheaters.length > 0 ? (
                filteredTheaters.map((theater, index) => (
                  <Col key={theater._id} lg={4} md={6}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5, transition: { duration: 0.3 } }}
                    >
                      <Card 
                        className="h-100 shadow-lg"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                          backdropFilter: 'blur(15px)',
                          borderRadius: '20px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onClick={() => handleTheaterClick(theater)}
                      >
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <div className="me-3 p-2 rounded-circle" style={{ background: 'linear-gradient(135deg, #e50914, #ff4757)' }}>
                                <FaBuilding className="text-white" size={16} />
                              </div>
                              <h5 className="text-white mb-0 fw-bold">{theater.name}</h5>
                            </div>
                            <Badge style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }} className="px-3 py-2">
                              <FaUsers className="me-1" size={12} />
                              {theater.screens?.length || 0} Screens
                            </Badge>
                          </div>
                          
                          <div className="d-flex align-items-center mb-2">
                            <FaMapMarkerAlt className="text-white me-2" size={12} />
                            <span className="text-white fw-medium" style={{ fontSize: '0.85rem' }}>
                              {theater.address?.city || theater.city}
                            </span>
                          </div>
                          
                          <div className="d-flex align-items-center mb-3">
                            <FaStar className="text-warning me-1" size={12} />
                            <span className="text-white fw-medium" style={{ fontSize: '0.8rem' }}>4.5</span>
                            <span className="text-white-50 ms-1" style={{ fontSize: '0.75rem' }}>(250+)</span>
                          </div>

                          {theater.amenities && theater.amenities.length > 0 && (
                            <div className="mb-3">
                              <div className="d-flex flex-wrap gap-1">
                                {theater.amenities.slice(0, 2).map((amenity, i) => (
                                  <Badge 
                                    key={i}
                                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}
                                    className="px-2 py-1 text-white"
                                  >
                                    {amenity}
                                  </Badge>
                                ))}
                                {theater.amenities.length > 2 && (
                                  <Badge style={{ backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }} className="px-2 py-1 text-white">
                                    +{theater.amenities.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <Button 
                            className="w-100 fw-bold"
                            style={{ 
                              background: 'linear-gradient(135deg, #e50914, #ff4757)',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '0.75rem',
                              fontSize: '0.9rem',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            View Movies & Shows
                            <FaChevronRight className="ms-2" size={12} />
                          </Button>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                ))
              ) : (
                <Col xs={12}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card 
                      className="text-center py-5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: 'none', borderBottom: '3px solid rgba(255,255,255,0.2)' }}
                    >
                      <Card.Body>
                        <div className="mb-4 mx-auto p-4 rounded-circle" style={{ backgroundColor: '#343a40', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaBuilding size={32} className="text-white" />
                        </div>
                        <h4 className="text-white mb-3 fw-bold">No Theaters Found</h4>
                        <p className="text-light mb-4">
                          We couldn't find any theaters matching your search criteria. Try adjusting your filters.
                        </p>
                        <Button
                          variant="outline-light"
                          className="px-4 py-2 fw-semibold"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCity('');
                          }}
                        >
                          Clear All Filters
                        </Button>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              )}
            </AnimatePresence>
          </Row>
        )}

        {/* Theater Detail View */}
        {selectedTheater && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Theater Header Card */}
            <Card className="shadow-lg mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: 'none', borderBottom: '3px solid rgba(255,255,255,0.2)' }}>
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={8}>
                    <div className="mb-3">
                      <h3 className="text-white mb-2 fw-bold">{selectedTheater.name}</h3>
                      <div className="d-flex align-items-center text-light">
                        <FaMapMarkerAlt className="text-light me-2" />
                        <span>
                          {selectedTheater.location || selectedTheater.address?.street}, {selectedTheater.address?.city || selectedTheater.city}
                        </span>
                      </div>
                    </div>
                  </Col>
                  <Col md={4} className="text-md-end">
                    <div className="text-md-end">
                      <Badge bg="secondary" className="px-4 py-2 mb-2">
                        <FaUsers className="me-2" />
                        {selectedTheater.screens?.length || 0} Screens Available
                      </Badge>
                      <div className="d-flex align-items-center justify-content-md-end">
                        <FaStar className="text-warning me-1" />
                        <span className="text-light fw-semibold">4.5 Rating</span>
                        <span className="text-muted ms-2">(250+ reviews)</span>
                      </div>
                    </div>
                  </Col>
                </Row>
                
                {/* Amenities */}
                {selectedTheater.amenities && selectedTheater.amenities.length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-white mb-3 fw-semibold">Premium Amenities</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedTheater.amenities.map((amenity, i) => (
                        <Badge 
                          key={i}
                          bg="dark"
                          className="px-3 py-2"
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Screens Section */}
            <div className="mb-4">
              <h5 className="text-white mb-3 fw-bold">Available Screens</h5>
              
              <Row className="g-2">
                {selectedTheater.screens && selectedTheater.screens.map((screen, index) => (
                  <Col key={index} md={4} lg={3}>
                    <Card 
                      className="shadow h-100"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: 'none',
                        borderBottom: '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h6 className="text-white mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
                            Screen {screen.screenNumber || index + 1}
                          </h6>
                          <Badge style={{ backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }} className="px-2 py-1 text-white">
                            {screen.screenType || '2D'}
                          </Badge>
                        </div>
                        
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <FaUsers className="text-white me-1" size={12} />
                            <span className="text-white fw-medium" style={{ fontSize: '0.8rem' }}>{screen.capacity}</span>
                          </div>
                          <Button 
                            variant="outline-light"
                            size="sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderColor: 'rgba(255,255,255,0.3)' }}
                          >
                            View
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Movies Section */}
            <div>
              <h5 className="text-white mb-3 fw-bold">Now Showing</h5>
              
              {loadingMovies ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="light" size="sm" />
                  <p className="text-white mt-2" style={{ fontSize: '0.9rem' }}>Loading movies...</p>
                </div>
              ) : theaterMovies.length > 0 ? (
                <Row className="g-3">
                  {theaterMovies.map((movie, index) => (
                    <Col key={movie._id} xs={6} sm={4} md={3} lg={2}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.3 }}
                      >
                        <div className="card border-0 h-100 shadow" 
                             style={{ backgroundColor: '#2a2d3a', borderRadius: '8px', cursor: 'pointer' }}
                             onClick={() => handleMovieClick(movie._id)}>
                          
                          <div className="position-relative" style={{ height: '200px' }}>
                            <img
                              src={movie.poster || `https://via.placeholder.com/200x300/333/fff?text=${encodeURIComponent(movie.title)}`}
                              alt={movie.title}
                              className="card-img-top w-100 h-100"
                              style={{ objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                              loading="lazy"
                            />
                            
                            {movie.shows && movie.shows.length > 0 && (
                              <div className="position-absolute top-0 end-0 m-2">
                                <Badge bg="success" className="d-flex align-items-center px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                  {movie.shows.length} Shows
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="card-body p-2 d-flex flex-column">
                            <h6 className="card-title text-white mb-1" 
                                style={{ fontSize: '0.85rem', lineHeight: '1.2', height: '2.4rem', overflow: 'hidden' }}>
                              {movie.title}
                            </h6>
                            
                            <div className="d-flex gap-1 mb-2">
                              <Badge bg="secondary" style={{ fontSize: '0.6rem' }}>
                                {Array.isArray(movie.genre) ? movie.genre[0] : (movie.genre || 'Action')}
                              </Badge>
                            </div>
                            
                            <Button 
                              variant="primary"
                              size="sm"
                              className="w-100 mt-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/movie/${movie._id}/showtimes?city=${encodeURIComponent(selectedTheater.address?.city || selectedTheater.city || '')}&theaterId=${selectedTheater._id}`);
                              }}
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '6px 8px',
                                minHeight: '28px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Card 
                  className="text-center py-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: 'none', borderBottom: '3px solid rgba(255,255,255,0.2)' }}
                >
                  <Card.Body>
                    <div className="mb-3 mx-auto p-3 rounded-circle" style={{ backgroundColor: 'rgba(255,255,255,0.1)', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaFilm size={24} className="text-white" />
                    </div>
                    <h6 className="text-white mb-2 fw-bold">No Movies Currently Showing</h6>
                    <p className="text-white" style={{ fontSize: '0.85rem' }}>
                      There are no movies currently scheduled at {selectedTheater.name}. Check back soon for updates!
                    </p>
                  </Card.Body>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </Container>
    </div>
  );
};

export default Theaters;