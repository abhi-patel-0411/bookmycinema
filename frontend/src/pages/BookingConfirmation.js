import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Alert, Badge } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaTicketAlt,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaFilm,
  FaUsers,
  FaDownload,
  FaHome,
  FaStar,
  FaCouch,
} from "react-icons/fa";
import { bookingsAPI } from "../services/api";
import ModernLoader from "../components/common/ModernLoader";
import MovieTicket from "../components/ticket/MovieTicket";
import moment from "moment";

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingsAPI.getById(bookingId);
      setBooking(response.data);
    } catch (error) {
      console.error("Error fetching booking details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ModernLoader text="Loading Confirmation" />;
  if (!booking) {
    return (
      <Container className="text-center py-5">
        <Alert variant="warning" className="d-inline-block">
          <h4>Booking not found</h4>
          <Button as={Link} to="/movies" variant="primary">
            <FaFilm className="me-2" />
            Browse Movies
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="min-vh-100 py-4 mt-5" style={{ backgroundColor: '#1f2025' }}>
      <Container>
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-4 border-bottom border-secondary"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-3"
          >
            <FaCheckCircle
              className="text-success"
              style={{ fontSize: "3rem" }}
            />
          </motion.div>
          <h2 className="text-white mb-2">Booking Confirmed!</h2>
          <p className="text-light mb-0">
            Your movie tickets have been booked successfully
          </p>
        </motion.div>

        {/* Booking Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="py-4 border-bottom border-secondary"
        >
          <div className="text-center mb-3">
            <FaTicketAlt className="text-warning me-2" size={20} />
            <span className="text-light me-2">Booking ID:</span>
            <Badge bg="warning" text="dark" className="px-3 py-1">
              {booking.bookingId || booking._id}
            </Badge>
          </div>

          <Row className="g-3 justify-content-center">
            <Col md={3} sm={6} xs={6}>
              <div className="text-center">
                <FaFilm className="text-info mb-2" size={20} />
                <h6 className="text-white mb-1">
                  {booking.show?.movie?.title}
                </h6>
                <small className="text-light opacity-75">Movie</small>
              </div>
            </Col>
            <Col md={3} sm={6} xs={6}>
              <div className="text-center">
                <FaMapMarkerAlt className="text-success mb-2" size={20} />
                <h6 className="text-white mb-1">
                  {booking.show?.theater?.name}
                </h6>
                <small className="text-light opacity-75">Theater</small>
              </div>
            </Col>
            <Col md={2} sm={6} xs={6}>
              <div className="text-center">
                <FaCalendarAlt className="text-warning mb-2" size={20} />
                <h6 className="text-white mb-1">
                  {moment(booking.show?.showDate).format("MMM DD")}
                </h6>
                <small className="text-light opacity-75">Date</small>
              </div>
            </Col>
            <Col md={2} sm={6} xs={6}>
              <div className="text-center">
                <FaClock className="text-info mb-2" size={20} />
                <h6 className="text-white mb-1">{booking.show?.showTime}</h6>
                <small className="text-light opacity-75">Time</small>
              </div>
            </Col>
            <Col md={2} sm={12} xs={12}>
              <div className="text-center">
                <div className="mb-2">
                  {booking.seats?.slice(0, 3).map((seat, index) => (
                    <Badge key={index} bg="success" className="me-1 px-2 py-1">
                      {seat}
                    </Badge>
                  ))}
                  {booking.seats?.length > 3 && (
                    <Badge bg="secondary" className="px-2 py-1">
                      +{booking.seats.length - 3}
                    </Badge>
                  )}
                </div>
                <small className="text-light opacity-75">Seats</small>
              </div>
            </Col>
          </Row>

          <div className="text-center mt-3">
            <span className="text-light me-2">Total Amount:</span>
            <h4 className="text-warning d-inline mb-0">
              ₹{booking.totalAmount}
            </h4>
          </div>
        </motion.div>

        {/* Movie Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="py-4 border-bottom border-secondary"
        >
          <MovieTicket booking={booking} />
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="py-4 border-bottom border-secondary"
        >
          <h5 className="text-white text-center mb-4 d-flex align-items-center justify-content-center">
            <FaUsers className="text-info me-2" />
            Important Instructions
          </h5>
          <Row className="g-3 justify-content-center">
            <Col md={6}>
              <div className="d-flex align-items-center mb-3">
                <FaClock className="text-warning me-3" size={18} />
                <span className="text-light">
                  Arrive 15 minutes before show time
                </span>
              </div>
              <div className="d-flex align-items-center">
                <FaTicketAlt className="text-success me-3" size={18} />
                <span className="text-light">
                  Carry valid ID proof for verification
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-center mb-3">
                <FaMapMarkerAlt className="text-info me-3" size={18} />
                <span className="text-light">
                  Show this confirmation at theater entrance
                </span>
              </div>
              <div className="d-flex align-items-center">
                <FaFilm className="text-danger me-3" size={18} />
                <span className="text-light">
                  Outside food and beverages not allowed
                </span>
              </div>
            </Col>
          </Row>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center py-4"
        >
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Button
              as={Link}
              to="/my-bookings"
              variant="primary"
              className="px-4"
            >
              <FaTicketAlt className="me-2" />
              View All Bookings
            </Button>
            <Button as={Link} to="/movies" variant="success" className="px-4">
              <FaFilm className="me-2" />
              Book More Movies
            </Button>
            <Button as={Link} to="/" variant="outline-light" className="px-4">
              <FaHome className="me-2" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default BookingConfirmation;
