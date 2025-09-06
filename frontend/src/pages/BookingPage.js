import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import {
  FaClock,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaTicketAlt,
  FaTimes,
} from "react-icons/fa";
import { useUser } from "@clerk/clerk-react";
import ModernLoader from "../components/common/ModernLoader";
import CustomSeatLayout from "../components/booking/CustomSeatLayout";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { toast } from "react-toastify";
import "../styles/seat-layout.css";
import "../styles/seat-conflict.css";

const BookingPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seatLayout, setSeatLayout] = useState([]);
  const [conflictMessage, setConflictMessage] = useState("");
  const [lockedSeats, setLockedSeats] = useState([]);
  const [seatTimer, setSeatTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [pendingSeats, setPendingSeats] = useState(new Set());
  const [processingSeatIds, setProcessingSeatIds] = useState(new Set());
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    fetchShowDetails();
    setupRealTimeListeners();

    return () => {
      if (selectedSeats.length > 0) {
        releaseSelectedSeats();
      }
      setProcessingSeatIds(new Set());
    };
  }, [showId]);

  // Add event listener for auto-released seats
  useEffect(() => {
    const handleAutoReleasedSeats = (event) => {
      const {
        showId: eventShowId,
        seats,
        userId: eventUserId,
        message,
      } = event.detail;
      if (eventShowId === showId && eventUserId === user?.id) {
        // Update selected seats if they were auto-released
        setSelectedSeats((prev) =>
          prev.filter((seat) => !seats.includes(seat.id))
        );
        if (seats.length > 0 && message) {
          toast.warning(message);
        }
      }
    };

    window.addEventListener("seats-auto-released", handleAutoReleasedSeats);

    return () => {
      window.removeEventListener(
        "seats-auto-released",
        handleAutoReleasedSeats
      );
    };
  }, [showId, user]);

  // Start seat selection timer
  const startSeatTimer = () => {
    if (seatTimer) clearInterval(seatTimer);

    setTimeRemaining(60);
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setSeatTimer(timer);
  };

  // Clear timer when seats are released or component unmounts
  useEffect(() => {
    if (selectedSeats.length === 0 && seatTimer) {
      clearInterval(seatTimer);
      setSeatTimer(null);
      setTimeRemaining(0);
    }

    return () => {
      if (seatTimer) clearInterval(seatTimer);
    };
  }, [selectedSeats.length, seatTimer]);

  // Clear pending seats after timeout
  useEffect(() => {
    if (pendingSeats.size > 0) {
      const timeout = setTimeout(() => {
        setPendingSeats(new Set());
      }, 3000); // Clear pending after 3 seconds

      return () => clearTimeout(timeout);
    }
  }, [pendingSeats.size]);

  const setupRealTimeListeners = () => {
    window.addEventListener("seat-conflict", handleSeatConflict);
    window.addEventListener("seats-selected", handleSeatsSelected);
    window.addEventListener("seats-released", handleSeatsReleased);
    window.addEventListener("seats-booked", handleSeatsBooked);
    window.addEventListener("seats-auto-released", handleAutoReleasedSeats);
    window.addEventListener("seats-available", handleSeatsAvailable);

    return () => {
      window.removeEventListener("seat-conflict", handleSeatConflict);
      window.removeEventListener("seats-selected", handleSeatsSelected);
      window.removeEventListener("seats-released", handleSeatsReleased);
      window.removeEventListener("seats-booked", handleSeatsBooked);
      window.removeEventListener(
        "seats-auto-released",
        handleAutoReleasedSeats
      );
      window.removeEventListener("seats-available", handleSeatsAvailable);
    };
  };

  const handleSeatConflict = (event) => {
    const {
      showId: conflictShowId,
      conflicts,
      message,
      userId: conflictUserId,
    } = event.detail;
    // Only show conflict message if it's for the current show and meant for this user
    if (
      conflictShowId === showId &&
      (!conflictUserId || conflictUserId === user?.id)
    ) {
      setConflictMessage(message);
      toast.error(message);
      setTimeout(() => setConflictMessage(""), 5000);
    }
  };

  const handleSeatsSelected = (event) => {
    const { showId: eventShowId, seats, userId: eventUserId } = event.detail;
    if (
      eventShowId === showId &&
      eventUserId !== user?.id &&
      eventUserId !== clerkUser?.id
    ) {
      // Remove from pending first
      setPendingSeats((prev) => {
        const newSet = new Set(prev);
        seats.forEach((seat) => newSet.delete(seat));
        return newSet;
      });

      setLockedSeats((prev) => [...new Set([...prev, ...seats])]);
      setSelectedSeats((prev) =>
        prev.filter((seat) => !seats.includes(seat.id))
      );
    }
  };

  const handleSeatsReleased = (event) => {
    const { showId: eventShowId, seats, userId: eventUserId } = event.detail;
    if (eventShowId === showId) {
      // Clear from all states
      setPendingSeats((prev) => {
        const newSet = new Set(prev);
        seats.forEach((seat) => newSet.delete(seat));
        return newSet;
      });

      setLockedSeats((prev) => prev.filter((seat) => !seats.includes(seat)));

      if (eventUserId === user?.id || eventUserId === clerkUser?.id) {
        setSelectedSeats((prev) =>
          prev.filter((seat) => !seats.includes(seat.id))
        );
        if (seats.length > 0) {
          toast.warning(
            "Your seat selection has expired. Please select seats again."
          );
        }
      }
    }
  };

  const handleSeatsBooked = (event) => {
    const { showId: eventShowId, bookedSeats: newBookedSeats } = event.detail;
    if (eventShowId === showId) {
      setBookedSeats((prev) => [...new Set([...prev, ...newBookedSeats])]);
      setLockedSeats((prev) =>
        prev.filter((seat) => !newBookedSeats.includes(seat))
      );
    }
  };

  const handleAutoReleasedSeats = (event) => {
    const {
      showId: eventShowId,
      seats,
      userId: eventUserId,
      message,
    } = event.detail;
    if (eventShowId === showId) {
      // Remove from locked seats for all users
      setLockedSeats((prev) => prev.filter((seat) => !seats.includes(seat)));

      // If this user's seats were auto-released, clear their selected seats
      if (eventUserId === user?.id || eventUserId === clerkUser?.id) {
        setSelectedSeats([]);
        if (seatTimer) {
          clearInterval(seatTimer);
          setSeatTimer(null);
          setTimeRemaining(0);
        }
        if (seats.length > 0 && message) {
          toast.warning(message);
        }
      }
    }
  };

  const handleSeatsAvailable = (event) => {
    const { showId: eventShowId, seats } = event.detail;
    if (eventShowId === showId) {
      // Remove from locked seats when they become available
      setLockedSeats((prev) => prev.filter((seat) => !seats.includes(seat)));
    }
  };

  const selectSeatsOnServer = async (seats) => {
    try {
      const response = await api.post("/bookings/select-seats", {
        showId: show._id,
        seats: seats.map((seat) => seat.id),
      });
      setNetworkError(false);
      return { success: true };
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !navigator.onLine || error.response?.status === 503) {
        setNetworkError(true);
        const message = error.response?.data?.type === "network_error" 
          ? "Database connection lost. Please try again."
          : "Network connection lost. Please check your internet connection.";
        toast.error(message);
        return { success: false, message: "Network error" };
      }
      if (error.response?.status === 409) {
        const message = error.response.data.message;
        const conflicts = error.response.data.conflicts || [];
        toast.error(message);
        setConflictMessage(message);
        setTimeout(() => setConflictMessage(""), 5000);
        setLockedSeats((prev) => [...new Set([...prev, ...conflicts])]);
        return { success: false, message, conflicts };
      }
      toast.error("Server error. Please try again.");
      return { success: false, message: "Failed to select seats" };
    }
  };

  const releaseSelectedSeats = async () => {
    if (selectedSeats.length === 0) return;

    try {
      await api.post("/bookings/release-seats", {
        showId: show._id,
        seats: selectedSeats.map((seat) => seat.id),
      });
    } catch (error) {
      console.error("Error releasing seats:", error);
    }
  };

  const fetchShowDetails = async () => {
    try {
      const response = await api.get(`/shows/${showId}`);
      const showData = response.data;
      setShow(showData);
      setBookedSeats(showData.bookedSeats || []);
      generateSeatLayout(showData.theater, showData.screenNumber);
      setNetworkError(false);
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !navigator.onLine || error.response?.status === 503) {
        setNetworkError(true);
        const message = error.response?.data?.type === "network_error"
          ? "Database connection lost. Unable to load show details."
          : "Network connection lost. Unable to load show details.";
        toast.error(message);
      } else {
        toast.error("Failed to load show details");
        navigate("/movies");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSeatLayout = (theater, screenNumber = 1) => {
    if (theater?.screens && theater.screens.length > 0) {
      const screen = theater.screens.find(
        (s) => s.screenNumber === screenNumber
      );

      if (screen?.seatLayout && screen.seatLayout.length > 0) {
        setSeatLayout(screen.seatLayout);
        return;
      }
    }

    const defaultLayout = [
      {
        row: "A",
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10],
        class: "silver",
        section: "Silver",
      },
      {
        row: "B",
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10],
        class: "silver",
        section: "Silver",
      },
      {
        row: "C",
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10],
        class: "gold",
        section: "Gold",
      },
      {
        row: "D",
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10],
        class: "gold",
        section: "Gold",
      },
      {
        row: "E",
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10],
        class: "gold",
        section: "Gold",
      },
      {
        row: "F",
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10],
        class: "premium",
        section: "Premium",
      },
      {
        row: "G",
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10],
        class: "premium",
        section: "Premium",
      },
      {
        row: "H",
        seats: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10],
        class: "premium",
        section: "Premium",
      },
    ];
    setSeatLayout(defaultLayout);
  };

  const handleSeatClick = async (seat) => {
    if (bookedSeats.includes(seat.id)) return;
    if (pendingSeats.has(seat.id)) return;
    if (processingSeatIds.has(seat.id)) return; // Prevent simultaneous operations

    if (
      lockedSeats.includes(seat.id) &&
      !selectedSeats.some((s) => s.id === seat.id) &&
      !pendingSeats.has(seat.id)
    ) {
      const conflictMessage = `Seat ${seat.id} is currently being selected by another user`;
      toast.error(conflictMessage);
      setConflictMessage(conflictMessage);
      setTimeout(() => setConflictMessage(""), 5000);
      return;
    }

    await processSeatClick(seat);
  };

  const processSeatClick = async (seat) => {
    // Mark seat as being processed
    setProcessingSeatIds((prev) => new Set([...prev, seat.id]));

    try {
      const isSelected = selectedSeats.some((s) => s.id === seat.id);

      if (isSelected) {
        setPendingSeats((prev) => new Set([...prev, seat.id]));
        setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));

        try {
          await api.post("/bookings/release-seats", {
            showId: show._id,
            seats: [seat.id],
          });
          setNetworkError(false);
        } catch (error) {
          if (error.code === "ERR_NETWORK" || !navigator.onLine || error.response?.status === 503) {
            setNetworkError(true);
            const message = error.response?.data?.type === "network_error"
              ? "Database connection lost. Seat may not be released properly."
              : "Network error. Seat may not be released properly.";
            toast.error(message);
          } else {
            toast.error("Failed to release seat. Please try again.");
          }
          setSelectedSeats((prev) => [...prev, seat]);
        } finally {
          setPendingSeats((prev) => {
            const newSet = new Set(prev);
            newSet.delete(seat.id);
            return newSet;
          });
        }
      } else {
        if (selectedSeats.length + pendingSeats.size >= 10) {
          toast.warning("Maximum 10 seats can be selected");
          return;
        }

        setPendingSeats((prev) => new Set([...prev, seat.id]));

        try {
          const result = await selectSeatsOnServer([seat]);
          if (result.success) {
            setSelectedSeats((prev) => [...prev, seat]);
            startSeatTimer();
          }
        } finally {
          setPendingSeats((prev) => {
            const newSet = new Set(prev);
            newSet.delete(seat.id);
            return newSet;
          });
        }
      }
    } finally {
      // Always remove from processing set
      setProcessingSeatIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seat.id);
        return newSet;
      });
    }
  };

  const getSeatStatus = (seat) => {
    if (bookedSeats.includes(seat.id)) return "booked";
    if (pendingSeats.has(seat.id)) return "pending";
    if (selectedSeats.find((s) => s.id === seat.id)) return "selected";
    if (lockedSeats.includes(seat.id) && !pendingSeats.has(seat.id)) return "locked";
    return "available";
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return <ModernLoader text="Loading Show Details" />;
  }

  if (!show) {
    return (
      <Container
        className="py-5 text-center"
        style={{
          marginTop: "80px",
          backgroundColor: "#1f2025",
          minHeight: "100vh",
        }}
      >
        <h2 className="text-white">Show not found</h2>
        <Button
          onClick={() => navigate("/movies")}
          variant="primary"
          className="mt-3"
        >
          Back to Movies
        </Button>
      </Container>
    );
  }

  return (
    <div
      className="min-vh-100"
      style={{
        paddingTop: "100px",
        paddingBottom: "20px",
        backgroundColor: "#1f2025",
      }}
    >
      <Container>
        {/* Movie Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 border-bottom border-secondary"
        >
          <Row className="align-items-center g-3">
            <Col xs={12} sm={3} md={2} className="text-center">
              <img
                src={
                  show.movie?.poster || "https://via.placeholder.com/120x160"
                }
                alt={show.movie?.title}
                className="img-fluid rounded-3"
                style={{
                  maxWidth: "120px",
                  maxHeight: "160px",
                  objectFit: "cover",
                }}
              />
            </Col>
            <Col xs={12} sm={9} md={6}>
              <h3 className="text-white mb-3">{show.movie?.title}</h3>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center text-light">
                  <FaMapMarkerAlt className="me-2 text-danger" size={14} />
                  <span>
                    {show.theater?.name}, {show.theater?.location}
                  </span>
                </div>
                <div className="d-flex align-items-center text-light">
                  <FaCalendarAlt className="me-2 text-info" size={14} />
                  <span>{formatDate(show.showDate)}</span>
                </div>
                <div className="d-flex align-items-center text-light">
                  <FaClock className="me-2 text-warning" size={14} />
                  <span>{formatTime(show.showTime)}</span>
                </div>
              </div>
            </Col>
            <Col xs={12} md={4} className="text-center text-md-end">
              <Badge bg="info" className="mb-2 px-3 py-2">
                {show.theater?.type || "2D"}
              </Badge>
              <div className="text-light small">Starting from</div>
              <div className="text-white h4 fw-bold">
                ₹{show.pricing?.silver || show.price}
              </div>
            </Col>
          </Row>
        </motion.div>

        {/* Network Error Message */}
        {networkError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-3 border-bottom border-danger"
          >
            <div className="text-danger d-flex align-items-center justify-content-center gap-2">
              🌐 Network connection lost. Some features may not work properly.
              <Button 
                size="sm" 
                variant="outline-light"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* Conflict Message */}
        {conflictMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-3 border-bottom border-warning"
          >
            <div className="text-warning">⚠️ {conflictMessage}</div>
          </motion.div>
        )}

        {/* Seat Selection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="py-4 border-bottom border-secondary"
        >
          <h4 className="text-white mb-4 text-center">
            <FaUsers className="me-2 text-primary" />
            Select Your Seats
          </h4>

          <div className="mb-4">
            <CustomSeatLayout
              seatLayout={seatLayout}
              bookedSeats={bookedSeats}
              selectedSeats={selectedSeats}
              lockedSeats={lockedSeats}
              pendingSeats={Array.from(pendingSeats)}
              onSeatClick={handleSeatClick}
              pricing={{
                silver: show?.pricing?.silver || show?.price || 150,
                gold:
                  show?.pricing?.gold || Math.round((show?.price || 150) * 1.3),
                premium:
                  show?.pricing?.premium ||
                  Math.round((show?.price || 150) * 1.8),
              }}
            />
          </div>

          {/* Seat Legend */}
          <div className="text-center">
            <h6 className="text-white fw-semibold mb-3">Seat Legend</h6>
            <Row className="g-3 justify-content-center">
              <Col xs={6} sm={4} md={2}>
                <div className="d-flex align-items-center justify-content-center">
                  <div
                    className="rounded me-2"
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                    }}
                  ></div>
                  <small className="text-light">Available</small>
                </div>
              </Col>
              <Col xs={6} sm={4} md={2}>
                <div className="d-flex align-items-center justify-content-center">
                  <div
                    className="rounded me-2 border border-white"
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#ff9800",
                    }}
                  ></div>
                  <small className="text-light">Selected</small>
                </div>
              </Col>
              <Col xs={6} sm={4} md={2}>
                <div className="d-flex align-items-center justify-content-center">
                  <div
                    className="rounded me-2 d-flex align-items-center justify-content-center text-white"
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </div>
                  <small className="text-light">Booked</small>
                </div>
              </Col>
              {/* <Col xs={6} sm={4} md={2}>
                <div className="d-flex align-items-center justify-content-center">
                  <div
                    className="rounded me-2"
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    }}
                  ></div>
                  <small className="text-light">Premium</small>
                </div>
              </Col> */}
              <Col xs={6} sm={4} md={2}>
                <div className="d-flex align-items-center justify-content-center">
                  <div
                    className="rounded me-2 d-flex align-items-center justify-content-center"
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      fontSize: "10px",
                    }}
                  >
                    ⏳
                  </div>
                  <small className="text-light">Being Selected</small>
                </div>
              </Col>
            </Row>
          </div>
        </motion.div>

        {/* Booking Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="py-4 border-bottom border-secondary"
        >
          <h5 className="text-white text-center mb-4">
            <FaTicketAlt className="me-2 text-success" />
            Booking Summary
          </h5>

          {selectedSeats.length > 0 ? (
            <>
              {/* Selected Seats */}
              <div className="text-center mb-4">
                <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                  <h6 className="text-light mb-0">
                    Selected Seats ({selectedSeats.length})
                  </h6>
                  {timeRemaining > 0 && (
                    <Badge
                      bg={timeRemaining <= 10 ? "danger" : "warning"}
                      className="d-flex align-items-center gap-1"
                    >
                      ⏱️ {Math.floor(timeRemaining / 60)}:
                      {(timeRemaining % 60).toString().padStart(2, "0")}
                    </Badge>
                  )}
                </div>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {selectedSeats.map((seat) => (
                    <Badge
                      key={seat.id}
                      bg="danger"
                      className="d-flex align-items-center gap-1 px-3 py-2"
                    >
                      {seat.id}
                      <button
                        className="btn-close btn-close-white"
                        style={{ fontSize: "10px" }}
                        onClick={() => handleSeatClick(seat)}
                      >
                        <FaTimes size={8} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <Row className="justify-content-center">
                <Col md={6}>
                  <div className="mb-4">
                    {selectedSeats.some((s) => s.class === "silver") && (
                      <div className="d-flex justify-content-between mb-2 text-light">
                        <span>Silver Seats</span>
                        <span>
                          {
                            selectedSeats.filter((s) => s.class === "silver")
                              .length
                          }{" "}
                          × ₹{show?.pricing?.silver || show?.price || 150}
                        </span>
                      </div>
                    )}
                    {selectedSeats.some((s) => s.class === "gold") && (
                      <div className="d-flex justify-content-between mb-2 text-light">
                        <span>Gold Seats</span>
                        <span>
                          {
                            selectedSeats.filter((s) => s.class === "gold")
                              .length
                          }{" "}
                          × ₹
                          {show?.pricing?.gold ||
                            Math.round((show?.price || 150) * 1.3)}
                        </span>
                      </div>
                    )}
                    {selectedSeats.some((s) => s.class === "premium") && (
                      <div className="d-flex justify-content-between mb-2 text-light">
                        <span>Premium Seats</span>
                        <span>
                          {
                            selectedSeats.filter((s) => s.class === "premium")
                              .length
                          }{" "}
                          × ₹
                          {show?.pricing?.premium ||
                            Math.round((show?.price || 150) * 1.8)}
                        </span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between pt-3 border-top border-secondary">
                      <span className="text-white fw-bold">Total Amount</span>
                      <span className="text-white fw-bold h5">
                        ₹{calculateTotal()}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="text-center">
                <Button
                  variant="danger"
                  size="lg"
                  className="px-5 py-3 fw-bold"
                  onClick={() => {
                    if (!clerkUser) {
                      navigate("/sign-in");
                    } else {
                      // Create booking data and navigate to payment page
                      const bookingData = {
                        movieTitle: show.movie?.title,
                        moviePoster: show.movie?.poster,
                        theaterName: show.theater?.name,
                        showDate: formatDate(show.showDate),
                        showTime: formatTime(show.showTime),
                        seats: selectedSeats.map((seat) => seat.id),
                        totalAmount: calculateTotal(),
                        showId: show._id,
                        seatDetails: selectedSeats,
                        genre: show.movie?.genre?.[0] || "Movie",
                        rating: show.movie?.rating || "8.5",
                      };

                      navigate("/payment", { state: { bookingData } });
                    }
                  }}
                >
                  <FaTicketAlt className="me-2" />
                  Proceed to Payment
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <FaUsers size={40} className="text-muted mb-3" />
              <p className="text-light mb-0">
                Select seats to see booking summary
              </p>
            </div>
          )}
        </motion.div>
      </Container>
    </div>
  );
};

export default BookingPage;
