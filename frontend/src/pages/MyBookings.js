import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Pagination } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTicketAlt, 
  FaFilm,
  FaTimes,
  FaExclamationTriangle,
  FaEye,
  FaMapMarkerAlt,
  FaCalendarAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import ModernLoader from '../components/common/ModernLoader';
import MovieTicket from '../components/ticket/MovieTicket';
import { useAuth } from '@clerk/clerk-react';
import moment from 'moment';

const MyBookings = () => {
  const { getToken, isSignedIn } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ show: false, booking: null });
  const [cancelling, setCancelling] = useState(false);
  const [ticketModal, setTicketModal] = useState({ show: false, booking: null });
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 9;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }
      
      const token = await getToken();
      const timestamp = new Date().getTime();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/bookings/my-bookings?_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const canCancelBooking = (booking) => {
    if (booking.status === 'cancelled' || !booking?.show?.showDate || !booking?.show?.showTime) return false;
    
    const showDateTime = moment(`${moment(booking.show.showDate).format('YYYY-MM-DD')} ${booking.show.showTime}`, 'YYYY-MM-DD h:mm A');
    const minutesUntilShow = showDateTime.diff(moment(), 'minutes');
    
    return minutesUntilShow > 15;
  };

  const handleCancelBooking = async () => {
    if (!cancelModal.booking) return;
    
    setCancelling(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/bookings/${cancelModal.booking._id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }
      
      setBookings(prev => prev.map(booking => 
        booking._id === cancelModal.booking._id 
          ? { ...booking, status: 'cancelled', cancelledAt: new Date() }
          : booking
      ));
      
      toast.success(`Booking cancelled! Refund: ₹${Math.round(cancelModal.booking.totalAmount * 0.9)}`);
      setCancelModal({ show: false, booking: null });
    } catch (error) {
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <ModernLoader text="Loading Bookings" />;
  
  if (!isSignedIn) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#1f2025' }}>
        <div className="text-center">
          <h4 className="text-white mb-3">Please Sign In</h4>
          <p className="text-light">Sign in to view your bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#1f2025', paddingTop: '100px' }}>
      <style>
        {`
          @keyframes borderGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.4); }
            50% { box-shadow: 0 0 30px rgba(255, 107, 107, 0.6); }
          }
          @keyframes pageGlow {
            0%, 100% { box-shadow: 0 0 15px rgba(255, 107, 107, 0.3); }
            50% { box-shadow: 0 0 25px rgba(255, 107, 107, 0.6); }
          }
          .booking-card {
            border: 2px solid #ff6b6b !important;
            animation: borderGlow 3s ease-in-out infinite;
            transition: all 0.3s ease;
          }
          .booking-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3) !important;
          }
        `}
      </style>
      
      <Container>
        <div className="text-center mb-5">
          <FaTicketAlt size={48} className="text-danger mb-3" />
          <h2 className="text-white fw-bold mb-2">My Bookings</h2>
          <p className="text-light">Manage your movie tickets</p>
        </div>

        <AnimatePresence>
          {bookings.length > 0 ? (
            <>
              <Row className="g-3 justify-content-center">
                {bookings
                  .slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage)
                  .map((booking, index) => (
                <Col key={booking._id} xl={4} lg={6} md={6} sm={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="h-100"
                  >
                    <Card className="booking-card bg-secondary border-0 text-white h-100">
                      <Card.Body className="p-3 d-flex flex-column">
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center flex-grow-1">
                            <FaFilm className="text-danger me-2" size={18} />
                            <div className="flex-grow-1">
                              <h6 className="text-white mb-1 fw-bold" style={{ fontSize: '0.9rem' }}>
                                {booking.show?.movie?.title || booking.movieTitle || 'Movie Title'}
                                {((booking.show?.movie && !booking.show.movie.isActive) || (booking.movieIsActive === false)) && (
                                  <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>No Longer Available</Badge>
                                )}
                              </h6>
                              <small className="text-light" style={{ fontSize: '0.75rem' }}>#{booking.bookingId}</small>
                            </div>
                          </div>
                          <Badge 
                            bg={booking.status === 'confirmed' ? 'success' : 'danger'} 
                            className="px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                          >
                            {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="mb-3 flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <FaMapMarkerAlt className="text-danger me-2" size={14} />
                            <div>
                              <div className="text-white fw-semibold" style={{ fontSize: '0.8rem' }}>
                                {booking.show?.theater?.name || booking.theaterName || 'Theater'}
                              </div>
                              <small className="text-light" style={{ fontSize: '0.7rem' }}>
                                {booking.show?.theater?.city || booking.show?.theater?.location || 'City'}
                              </small>
                            </div>
                          </div>
                          
                          <div className="d-flex align-items-center mb-2">
                            <FaCalendarAlt className="text-danger me-2" size={14} />
                            <div>
                              <div className="text-white fw-semibold" style={{ fontSize: '0.8rem' }}>
                                {moment(booking.show?.showDate || booking.showDate).format('MMM DD, YYYY')}
                              </div>
                              <small className="text-light" style={{ fontSize: '0.7rem' }}>
                                {booking.show?.showTime || booking.showTime || 'Time TBD'}
                              </small>
                            </div>
                          </div>

                          {/* Seats */}
                          <div className="mb-2">
                            <div className="text-white fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                              Seats ({booking.seats?.length || 0})
                            </div>
                            <div className="d-flex flex-wrap gap-1">
                              {booking.seats?.slice(0, 6).map(seat => (
                                <Badge key={seat} bg="dark" className="px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                  {seat}
                                </Badge>
                              ))}
                              {booking.seats?.length > 6 && (
                                <Badge bg="dark" className="px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                  +{booking.seats.length - 6}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary mt-auto">
                          <div>
                            <div className="h5 text-white mb-0 fw-bold">₹{booking.totalAmount}</div>
                            <small className={`badge ${booking.paymentStatus === 'completed' ? 'bg-success' : 'bg-warning'}`} style={{ fontSize: '0.65rem' }}>
                              {booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                            </small>
                          </div>
                          
                          {booking.status === 'confirmed' && (
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-light"
                                size="sm"
                                className="px-2 py-1"
                                style={{ fontSize: '0.7rem' }}
                                onClick={() => setTicketModal({ show: true, booking })}
                                disabled={(booking.show?.movie && !booking.show.movie.isActive) || (booking.movieIsActive === false)}
                              >
                                <FaEye size={10} className="me-1" />
                                View
                              </Button>
                              {canCancelBooking(booking) && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="px-2 py-1"
                                  style={{ fontSize: '0.7rem' }}
                                  onClick={() => setCancelModal({ show: true, booking })}
                                >
                                  <FaTimes size={10} className="me-1" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {booking.status === 'cancelled' && (
                          <div className="mt-2 pt-2 border-top border-secondary">
                            <small className="text-danger" style={{ fontSize: '0.7rem' }}>
                              Cancelled on {moment(booking.cancelledAt).format('MMM DD')}
                            </small>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
                ))}
              </Row>
              
              {bookings.length > bookingsPerPage && (
                <div className="d-flex justify-content-center mt-5">
                  <style>
                    {`
                      .custom-pagination .page-link {
                        background-color: #2a2d35 !important;
                        border: 2px solid #ff6b6b !important;
                        color: #ffffff !important;
                        margin: 0 2px;
                        border-radius: 10px !important;
                        padding: 8px 12px;
                        transition: all 0.3s ease;
                        font-weight: 500;
                      }
                      .custom-pagination .page-link:hover {
                        background-color: #ff6b6b !important;
                        color: #ffffff !important;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
                      }
                      .custom-pagination .page-item.active .page-link {
                        background-color: #ff6b6b !important;
                        border-color: #ff6b6b !important;
                        color: #ffffff !important;
                        box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
                      }
                      .custom-pagination .page-item.disabled .page-link {
                        background-color: #1a1d23 !important;
                        border-color: #404040 !important;
                        color: #6c757d !important;
                        opacity: 0.5;
                      }
                    `}
                  </style>
                  <Pagination className="custom-pagination">
                    <Pagination.First 
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    />
                    
                    {[...Array(Math.ceil(bookings.length / bookingsPerPage))].map((_, i) => (
                      <Pagination.Item
                        key={i + 1}
                        active={i + 1 === currentPage}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    
                    <Pagination.Next 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(bookings.length / bookingsPerPage)))}
                      disabled={currentPage === Math.ceil(bookings.length / bookingsPerPage)}
                    />
                    <Pagination.Last 
                      onClick={() => setCurrentPage(Math.ceil(bookings.length / bookingsPerPage))}
                      disabled={currentPage === Math.ceil(bookings.length / bookingsPerPage)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <FaTicketAlt size={80} className="text-muted mb-4" />
              <h3 className="text-white mb-3">No Bookings Found</h3>
              <p className="text-light mb-4 lead">Start booking your favorite movies!</p>
              <Button variant="danger" size="lg" href="/movies" className="px-5 py-3">
                <FaFilm className="me-2" />
                Browse Movies
              </Button>
            </div>
          )}
        </AnimatePresence>

        {/* Cancel Modal */}
        <Modal 
          show={cancelModal.show} 
          onHide={() => setCancelModal({ show: false, booking: null })}
          centered
        >
          <div style={{ backgroundColor: '#1f2025' }}>
            <Modal.Header className="border-secondary" style={{ backgroundColor: '#1f2025' }}>
              <div className="d-flex align-items-center">
                <FaExclamationTriangle className="text-warning me-3" size={24} />
                <div>
                  <Modal.Title className="text-white">Cancel Booking</Modal.Title>
                  <small className="text-light">This action cannot be undone</small>
                </div>
              </div>
            </Modal.Header>
            
            <Modal.Body style={{ backgroundColor: '#1f2025' }}>
              {cancelModal.booking && (
                <>
                  <div className="mb-4">
                    <h6 className="text-white">{cancelModal.booking.show?.movie?.title || cancelModal.booking.movieTitle}</h6>
                    <small className="text-light">Booking ID: #{cancelModal.booking.bookingId}</small>
                  </div>
                  
                  <Card className="bg-dark border-0 mb-4">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-light">Original Amount</span>
                        <span className="text-white fw-semibold">₹{cancelModal.booking.totalAmount}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-light">Cancellation Fee (10%)</span>
                        <span className="text-danger">-₹{Math.round(cancelModal.booking.totalAmount * 0.1)}</span>
                      </div>
                      <hr className="border-secondary" />
                      <div className="d-flex justify-content-between">
                        <span className="text-white fw-bold">Refund Amount</span>
                        <span className="text-success fw-bold h5 mb-0">₹{Math.round(cancelModal.booking.totalAmount * 0.9)}</span>
                      </div>
                    </Card.Body>
                  </Card>
                  
                  <small className="text-light">
                    Refund will be processed within 5-7 business days
                  </small>
                </>
              )}
            </Modal.Body>
            
            <Modal.Footer className="border-secondary" style={{ backgroundColor: '#1f2025' }}>
              <Button 
                variant="outline-light"
                onClick={() => setCancelModal({ show: false, booking: null })}
                disabled={cancelling}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelBooking}
                disabled={cancelling}
              >
                {cancelling ? 'Processing...' : 'Confirm Cancellation'}
              </Button>
            </Modal.Footer>
          </div>
        </Modal>

        {/* Ticket Modal */}
        <Modal 
          show={ticketModal.show} 
          onHide={() => setTicketModal({ show: false, booking: null })}
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-secondary border-0">
            <Modal.Title className="text-white">Movie Ticket</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark p-0">
            {ticketModal.booking && <MovieTicket booking={ticketModal.booking} />}
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default MyBookings;