import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaMapMarkerAlt, FaFilm, FaClock, FaTicketAlt, FaCalendarAlt, FaStar } from 'react-icons/fa';
import { moviesAPI } from '../services/api';
import showsService from '../services/showsService';
import ModernLoader from '../components/common/ModernLoader';

const ShowTimes = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [shows, setShows] = useState([]);
  const [theaters, setTheaters] = useState([]);
  
  // Add state for selected theater
  const [selectedTheaterId, setSelectedTheaterId] = useState('');

  useEffect(() => {
    fetchMovieDetails();
    fetchCities();
    generateAvailableDates();
    
    // Check for city and theaterId in query params or localStorage
    const queryParams = new URLSearchParams(location.search);
    const cityFromQuery = queryParams.get('city');
    const theaterIdFromQuery = queryParams.get('theaterId');
    const cityFromStorage = localStorage.getItem('selectedTheaterCity');
    
    if (cityFromQuery) {
      setSelectedCity(cityFromQuery);
    } else if (cityFromStorage) {
      setSelectedCity(cityFromStorage);
    }
    
    if (theaterIdFromQuery) {
      setSelectedTheaterId(theaterIdFromQuery);
    }
  }, [movieId, location.search]);
  
  useEffect(() => {
    if (selectedCity && selectedDate && movieId) {
      fetchShows();
    } else {
      console.log('Missing required data for fetching shows:', { 
        selectedCity, 
        selectedDate: selectedDate?.id, 
        movieId 
      });
    }
  }, [selectedCity, selectedDate, movieId]);
  
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    // Create dates for the next 14 days (including today)
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Extract year, month, day components
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();
      
      // Create a date string in YYYY-MM-DD format with zero-padding
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Create a new date object from the date string to ensure consistent date handling
      // Use UTC to avoid timezone issues
      const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      
      dates.push({
        id: dateString,
        date: day,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        fullDate: normalizedDate,
        isToday: i === 0
      });
    }
    
    console.log('Generated available dates:', dates.map(d => ({ 
      id: d.id, 
      fullDate: d.fullDate.toISOString() 
    })));
    
    setAvailableDates(dates);
    setSelectedDate(dates[0]);
  };
  
  const fetchMovieDetails = async () => {
    if (!movieId) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await moviesAPI.getById(movieId);
      const movieData = response.data;
      
      // Redirect to movies page if movie is expired/inactive
      if (!movieData || !movieData.isActive) {
        console.error('Movie is no longer available');
        navigate('/movies');
        return;
      }
      
      // Fetch movie rating
      try {
        const ratingResponse = await fetch(`http://localhost:5000/api/ratings/movie/${movieId}`);
        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          movieData.averageRating = parseFloat(ratingData.averageRating) || 0;
          movieData.totalRatings = ratingData.totalRatings || 0;
        } else {
          movieData.averageRating = 0;
          movieData.totalRatings = 0;
        }
      } catch (ratingError) {
        console.error('Error fetching movie rating:', ratingError);
        movieData.averageRating = 0;
        movieData.totalRatings = 0;
      }
      
      setMovie(movieData);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCities = async () => {
    try {
      const response = await showsService.getCities();
      setCities(response.data || ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad']);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad']);
    }
  };

  const formatShowTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      
      return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return timeString;
    }
  };

  const fetchShows = async () => {
    try {
      // Ensure we're using the correct date format YYYY-MM-DD
      const dateString = selectedDate?.id;
      console.log('Fetching shows for movie:', movieId, 'city:', selectedCity, 'date:', dateString);
      
      // Log the actual date object for debugging
      console.log('Selected date object:', selectedDate?.fullDate);
      
      // Make sure the date is in YYYY-MM-DD format
      let formattedDate = dateString;
      if (selectedDate?.fullDate) {
        const d = selectedDate.fullDate;
        formattedDate = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}-${d.getUTCDate().toString().padStart(2, '0')}`;
      }
      
      console.log('Using formatted date:', formattedDate);
      
      const response = await showsService.getShowsByMovieAndDate({
        movieId,
        city: selectedCity,
        date: formattedDate
      });
      
      const showsData = response.data || [];
      console.log('Shows data received:', showsData.length, 'shows');
      
      // Filter out past shows only if the selected date is today
      const currentTime = new Date();
      const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
      const selectedDateObj = new Date(selectedDate?.fullDate);
      const isToday = selectedDateObj.getFullYear() === today.getFullYear() && 
                      selectedDateObj.getMonth() === today.getMonth() && 
                      selectedDateObj.getDate() === today.getDate();
      
      const futureShows = isToday ? 
        // Only filter by time if the selected date is today
        showsData.filter(show => {
          if (!show.showDate || !show.showTime) return false;
          
          const showDateTime = new Date(show.showDate);
          const [hours, minutes] = show.showTime.split(':');
          showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          
          return showDateTime > currentTime;
        }) : 
        // If not today, show all shows for the selected date
        showsData;
      
      console.log('Future shows after filtering:', futureShows.length);
      
      // Filter shows by selected theater if theaterId is provided
      const filteredShows = selectedTheaterId 
        ? futureShows.filter(show => show.theater._id === selectedTheaterId)
        : futureShows;
      
      console.log('Shows after theater filtering:', filteredShows.length);
      
      const theaterGroups = filteredShows.reduce((acc, show) => {
        if (!show.theater || !show.theater._id) {
          console.log('Show missing theater data:', show._id);
          return acc;
        }
        
        const theaterId = show.theater._id;
        if (!acc[theaterId]) {
          acc[theaterId] = {
            id: theaterId,
            name: show.theater.name || 'Unknown Theater',
            location: show.theater.location || show.theater.address?.street || '',
            city: show.theater.city || show.theater.address?.city || selectedCity,
            facilities: Array.isArray(show.theater.amenities) ? show.theater.amenities : 
                       Array.isArray(show.theater.facilities) ? show.theater.facilities : 
                       ['M-Ticket', 'Food & Beverage'],
            shows: []
          };
        }
        
        // Calculate total seats if not provided
        const totalSeats = show.totalSeats || show.availableSeats + show.bookedSeats?.length || 100;
        
        acc[theaterId].shows.push({
          id: show._id,
          time: formatShowTime(show.showTime),
          price: show.price || 150,
          availableSeats: show.availableSeats || (totalSeats - (show.bookedSeats?.length || 0)),
          totalSeats: totalSeats,
          screenNumber: show.screenNumber || 1,
          format: show.format || '2D',
          language: show.language || 'Hindi'
        });
        return acc;
      }, {});
      
      const theatersList = Object.values(theaterGroups);
      console.log('Theaters with shows:', theatersList.length);
      setTheaters(theatersList);
    } catch (error) {
      console.error('Error fetching shows:', error);
      setTheaters([]);
    }
  };
  
  if (loading) {
    return (
      <div style={{ backgroundColor: '#1f2025', minHeight: '100vh', paddingTop: '100px' }}>
        <Container>
          <ModernLoader text="Loading Showtimes" />
        </Container>
      </div>
    );
  }
  
  return (
    <div style={{ backgroundColor: '#1f2025', minHeight: '100vh', paddingTop: '100px' }}>
      <Container>
        {/* Back Button */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="link"
            className="text-white p-0 d-flex align-items-center"
            onClick={() => navigate(-1)}
            style={{ textDecoration: 'none', fontSize: '16px' }}
          >
            <FaArrowLeft className="me-2" />
            Back to Movies
          </Button>
        </motion.div>

        {/* Movie Header */}
        {movie && (
          <motion.div 
            className="mb-4 p-4 border-bottom"
            style={{ backgroundColor: '#1f2025', borderBottomColor: 'rgba(255,255,255,0.1)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Row className="align-items-center">
              <Col md={3} lg={2} className="text-center text-md-start mb-3 mb-md-0">
                <motion.img 
                  src={movie.poster || 'https://picsum.photos/150/225'} 
                  alt={movie.title} 
                  className="img-fluid rounded-3 shadow"
                  style={{ maxWidth: '150px', maxHeight: '225px' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              </Col>
              <Col md={9} lg={10}>
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div>
                    <h2 className="text-white fw-bold mb-2">{movie.title}</h2>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center">
                        <FaStar className="text-warning me-1" size={16} />
                        <span className="text-white fw-semibold">{movie.averageRating > 0 ? movie.averageRating.toFixed(1) : 'N/A'}/5</span>
                      </div>
                      <div className="d-flex align-items-center text-light">
                        <FaClock className="me-1" size={14} />
                        <span>{movie.duration || '2h 30m'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {(movie.genre || ['Action', 'Drama']).map((g, i) => (
                    <Badge key={i} className="px-3 py-2" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                      {g}
                    </Badge>
                  ))}
                </div>
                <p className="text-light mb-0" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  {movie.description ? 
                    (movie.description.length > 150 ? movie.description.substring(0, 150) + '...' : movie.description) :
                    'Experience an epic cinematic journey with stunning visuals and compelling storytelling.'
                  }
                </p>
              </Col>
            </Row>
          </motion.div>
        )}

        {/* City & Date Selector */}
        <motion.div 
          className="mb-4 p-4 border-bottom"
          style={{ backgroundColor: '#1f2025', borderBottomColor: 'rgba(255,255,255,0.1)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Row className="g-4">
            {/* City Selector */}
            <Col lg={4}>
              <div className="d-flex align-items-center mb-3">
                <FaMapMarkerAlt className="text-danger me-2" size={18} />
                <h6 className="text-white mb-0 fw-semibold">Select City</h6>
              </div>
              <Form.Select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border-secondary text-white"
                style={{
                  backgroundColor: '#1f2025',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                <option value="">Choose your city</option>
                {cities.map((city) => (
                  <option key={city} value={city} style={{ backgroundColor: '#1f2025' }}>
                    {city}
                  </option>
                ))}
              </Form.Select>
            </Col>

            {/* Date Selector */}
            <Col lg={8}>
              <div className="d-flex align-items-center mb-3">
                <FaCalendarAlt className="text-danger me-2" size={18} />
                <h6 className="text-white mb-0 fw-semibold">Select Date</h6>
              </div>
              <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>
                  {`
                    .date-scroll::-webkit-scrollbar {
                      display: none;
                    }
                  `}
                </style>
                {availableDates.map((dateObj) => (
                  <motion.div
                    key={dateObj.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={selectedDate?.id === dateObj.id ? "danger" : "outline-light"}
                      className="flex-shrink-0 text-center"
                      style={{
                        minWidth: '80px',
                        height: '80px',
                        borderRadius: '12px',
                        border: selectedDate?.id === dateObj.id ? '2px solid #dc3545' : '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: selectedDate?.id === dateObj.id ? '#dc3545' : 'transparent'
                      }}
                      onClick={() => setSelectedDate(dateObj)}
                    >
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '500' }}>{dateObj.day}</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{dateObj.date}</div>
                        <div style={{ fontSize: '10px', fontWeight: '500' }}>{dateObj.month}</div>
                        {dateObj.isToday && (
                          <div style={{ fontSize: '8px', opacity: 0.8 }}>TODAY</div>
                        )}
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </Col>
          </Row>
        </motion.div>

        {/* Theater List */}
        <AnimatePresence>
          {!selectedCity ? (
            <motion.div
              className="text-center py-5 rounded-3 shadow"
              style={{ backgroundColor: '#1f2025' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <FaMapMarkerAlt size={60} className="text-muted mb-4" />
              <h4 className="text-white mb-3 fw-bold">Select Your City</h4>
              <p className="text-light mb-0">Choose a city from the dropdown above to view available showtimes</p>
            </motion.div>
          ) : theaters && theaters.length > 0 ? (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="text-white fw-bold mb-0">
                  <FaTicketAlt className="text-danger me-2" />
                  Available Shows in {selectedCity}
                </h5>
                <Badge bg="success" className="px-3 py-2">
                  {theaters.reduce((total, theater) => total + theater.shows.length, 0)} Shows Available
                </Badge>
              </div>
              
              {theaters.map((theater, index) => (
                <motion.div
                  key={theater.id}
                  className="mb-4 p-4 border-bottom"
                  style={{ backgroundColor: '#1f2025', borderBottomColor: 'rgba(255,255,255,0.1)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="text-white fw-bold mb-1">{theater.name || 'Theater'}</h6>
                      <div className="d-flex align-items-center text-light">
                        <FaMapMarkerAlt className="me-1" size={12} />
                        <small>
                          {theater.location ? `${theater.location}, ` : ''}
                          {theater.city || selectedCity}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      {(theater.facilities && theater.facilities.length > 0) ? 
                        theater.facilities.slice(0, 2).map((facility, i) => (
                          <Badge key={i} bg="secondary" className="px-2 py-1" style={{ fontSize: '10px' }}>
                            {facility}
                          </Badge>
                        )) : 
                        <Badge bg="secondary" className="px-2 py-1" style={{ fontSize: '10px' }}>
                          Standard
                        </Badge>
                      }
                    </div>
                  </div>
                  
                  <div className="d-flex flex-wrap gap-2">
                    {theater.shows.map((show) => {
                      const totalSeats = show.totalSeats || 100;
                      const availableSeats = show.availableSeats || 0;
                      const availabilityRatio = availableSeats / totalSeats;
                      const isAvailable = availableSeats > 0;
                      const buttonColor = availabilityRatio > 0.5 ? '#28a745' : availabilityRatio > 0.2 ? '#ffc107' : '#dc3545';
                      
                      return (
                        <motion.div
                          key={show.id}
                          whileHover={{ scale: isAvailable ? 1.05 : 1 }}
                          whileTap={{ scale: isAvailable ? 0.95 : 1 }}
                        >
                          <Button
                            disabled={!isAvailable}
                            className="text-white border-0"
                            style={{
                              backgroundColor: isAvailable ? buttonColor : '#6c757d',
                              borderRadius: '8px',
                              minWidth: '100px',
                              opacity: isAvailable ? 1 : 0.6,
                              padding: '12px 8px'
                            }}
                            onClick={() => navigate(`/booking/${show.id}`)}
                          >
                            <div className="text-center">
                              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{show.time}</div>
                              <div style={{ fontSize: '10px', opacity: 0.9 }}>
                                Screen {show.screenNumber} • {show.format}
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: '600' }}>₹{show.price || 150}</div>
                              <div style={{ fontSize: '9px', opacity: 0.8 }}>
                                {availableSeats} seats left
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {theater.shows.length === 0 && (
                    <div className="text-center py-3">
                      <small className="text-muted">No shows available for selected date</small>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-5 rounded-3 shadow"
              style={{ backgroundColor: '#1f2025' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <FaFilm size={60} className="text-muted mb-4" />
              <h4 className="text-white mb-3 fw-bold">No Shows Available</h4>
              <p className="text-light mb-4">
                No shows found for <span className="text-danger fw-semibold">{movie?.title}</span> in <span className="text-danger fw-semibold">{selectedCity}</span> on <span className="text-danger fw-semibold">{selectedDate?.date} {selectedDate?.month}</span>
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Button variant="outline-danger" onClick={() => setSelectedCity('')}>
                  Change City
                </Button>
                <Button variant="outline-light" onClick={() => setSelectedDate(availableDates[0])}>
                  Try Different Date
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default ShowTimes;