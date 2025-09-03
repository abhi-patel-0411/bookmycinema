import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaFilm,
  FaChevronRight,
  FaTicketAlt,
  FaStar,
  FaUsers,
  FaPlay,
  FaCalendarAlt,
  FaFilter,
  FaBuilding,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AOS from "aos";
import ModernLoader from "../components/common/ModernLoader";
import TheaterListLayout from "../components/theaters/TheaterListLayout";
import api from "../services/api";
import showsAPI from "../services/api/showsAPI";

const Theaters = () => {
  const navigate = useNavigate();
  const [theaters, setTheaters] = useState([]);
  const [filteredTheaters, setFilteredTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
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
      const response = await api.get("/theaters/with-shows");
      const theatersData = Array.isArray(response.data)
        ? response.data
        : response.data.theaters || [];

      setTheaters(theatersData);
      const uniqueCities = [
        ...new Set(
          theatersData
            .map((t) => (t.address?.city || t.city)?.toLowerCase())
            .filter(Boolean)
        ),
      ].map((city) => city.charAt(0).toUpperCase() + city.slice(1));
      setCities(uniqueCities);
    } catch (error) {
      console.error("Fetch theaters error:", error);
      toast.error("Failed to fetch theaters");
    } finally {
      setLoading(false);
    }
  };

  const filterTheaters = () => {
    let filtered = theaters.filter(
      (theater) => theater.status?.isActive !== false
    );

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (theater) =>
          theater.name?.toLowerCase().includes(search) ||
          theater.location?.toLowerCase().includes(search) ||
          theater.address?.city?.toLowerCase().includes(search)
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(
        (theater) =>
          (theater.address?.city || theater.city)?.toLowerCase() ===
          selectedCity.toLowerCase()
      );
    }

    setFilteredTheaters(filtered);
  };

  const handleMovieClick = (movieId, theater) => {
    const city = theater.address?.city || theater.city;
    navigate(
      `/movie/${movieId}/showtimes?city=${encodeURIComponent(city)}&theaterId=${
        theater._id
      }`
    );
  };

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: "#0f1419" }}
      >
        <ModernLoader text="Loading Theaters" />
      </div>
    );
  }

  return (
    <div
      className="min-vh-100"
      style={{
        backgroundColor: "#1f2025",
        paddingTop: "120px",
        paddingBottom: "50px",
      }}
    >
      <Container fluid="xl">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-5 position-relative"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="d-flex align-items-center justify-content-center mb-4">
            <motion.div
              className="p-4 rounded-circle me-4 position-relative"
              style={{
                background: "linear-gradient(135deg, #e50914, #ff4757)",
                boxShadow: "0 10px 30px rgba(229, 9, 20, 0.2)",
              }}
            >
              <FaBuilding size={36} className="text-white" />
            </motion.div>
            <div>
              <h1
                className="fw-bold text-white mb-2"
                style={{
                  fontFamily:
                    "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: "2.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Premium Theaters
              </h1>
              <div className="d-flex align-items-center justify-content-center gap-3">
                <Badge bg="warning" className="px-3 py-2">
                  <FaStar className="me-1" /> 4.8 Rating
                </Badge>
                <Badge bg="info" className="px-3 py-2">
                  <FaUsers className="me-1" /> 50K+ Visitors
                </Badge>
              </div>
            </div>
          </div>
          <p
            className="text-light mb-4"
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              fontFamily: "Inter, sans-serif",
              fontSize: "1.1rem",
              fontWeight: "400",
              lineHeight: "1.6",
              opacity: 0.9,
            }}
          >
            Experience cinema like never before with state-of-the-art sound
            systems, crystal-clear visuals, and luxury seating in India's finest
            theaters
          </p>

          {/* Stats Row */}
          <Row className="justify-content-center">
            <Col xs={4} sm={3} md={2}>
              <div className="text-center">
                <h3
                  className="text-white fw-bold mb-1"
                  style={{ fontSize: "1.8rem" }}
                >
                  {filteredTheaters.length}
                </h3>
                <p
                  className="text-light mb-0"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Theaters
                </p>
              </div>
            </Col>
            <Col xs={4} sm={3} md={2}>
              <div className="text-center">
                <h3
                  className="text-white fw-bold mb-1"
                  style={{ fontSize: "1.8rem" }}
                >
                  {cities.length}
                </h3>
                <p
                  className="text-light mb-0"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Cities
                </p>
              </div>
            </Col>
            <Col xs={4} sm={3} md={2}>
              <div className="text-center">
                <h3
                  className="text-white fw-bold mb-1"
                  style={{ fontSize: "1.8rem" }}
                >
                  24/7
                </h3>
                <p
                  className="text-light mb-0"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Support
                </p>
              </div>
            </Col>
          </Row>
        </motion.div>

        {/* Search & Filter Section */}
        {!selectedTheater && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card
              className="shadow-lg"
              style={{
                background: "#1f2025",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Card.Body className="p-4">
                <Row className="g-4">
                  <Col lg={6}>
                    <Form.Group>
                      <Form.Label
                        className="text-white fw-semibold mb-2 d-flex align-items-center"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.875rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        <FaSearch className="me-2 text-light" size={14} />{" "}
                        Search Theaters
                      </Form.Label>
                      <InputGroup size="lg">
                        <InputGroup.Text
                          style={{
                            backgroundColor: "#1f2025",
                            color: "white",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRight: "none",
                          }}
                        >
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search by name or location..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="text-white"
                          style={{
                            backgroundColor: "#1f2025 !important",
                            color: "white !important",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderLeft: "none",
                            backdropFilter: "blur(5px)",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "0.875rem",
                          }}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col lg={4}>
                    <Form.Group>
                      <Form.Label
                        className="text-white fw-semibold mb-2 d-flex align-items-center"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.875rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        <FaMapMarkerAlt className="me-2 text-light" size={14} />{" "}
                        Select City
                      </Form.Label>
                      <Form.Select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="text-white"
                        style={{
                          backgroundColor: "#1f2025 !important",
                          color: "white !important",
                          border: "1px solid rgba(255,255,255,0.2)",
                          backdropFilter: "blur(5px)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.875rem",
                        }}
                      >
                        <option
                          value=""
                          style={{ backgroundColor: "#2a2d3a", color: "#fff" }}
                        >
                          All Cities
                        </option>
                        {cities.map((city) => (
                          <option
                            key={city}
                            value={city}
                            style={{
                              backgroundColor: "#2a2d3a",
                              color: "#fff",
                            }}
                          >
                            {city}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={2} className="d-flex align-items-end">
                    <Button
                      variant="outline-light"
                      className="w-100"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                      }}
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCity("");
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

        {/* Results Header */}
        <motion.div
          className="d-flex align-items-center justify-content-between mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="d-flex align-items-center">
            <div
              className="me-3 p-3 rounded-circle"
              style={{ backgroundColor: "#e50914" }}
            >
              <FaBuilding className="text-white" size={20} />
            </div>
            <div>
              <h4
                className="text-white mb-1 fw-bold"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "1.25rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {filteredTheaters.length} Theater
                {filteredTheaters.length !== 1 ? "s" : ""} Found
              </h4>
              {selectedCity && (
                <p
                  className="text-light mb-0"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    opacity: 0.9,
                  }}
                >
                  <FaMapMarkerAlt className="me-1" size={14} /> in{" "}
                  {selectedCity}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Theater List Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div
            className="theater-list-wrapper"
            style={{
              background: "#1f2025",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              overflow: "hidden",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {filteredTheaters.length > 0 ? (
              <TheaterListLayout
                theaters={filteredTheaters}
                onMovieClick={handleMovieClick}
              />
            ) : (
              <div
                className="text-center py-5"
                style={{
                  padding: "60px 20px",
                  background: "#1f2025",
                  borderRadius: "12px",
                }}
              >
                <div
                  className="mb-4 mx-auto p-4 rounded-circle"
                  style={{
                    backgroundColor: "#1f2025",
                    width: "80px",
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <FaBuilding size={32} className="text-white" />
                </div>
                <h4
                  className="text-white mb-3 fw-bold"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "1.4rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  No Theaters Found
                </h4>
                <p
                  className="text-light mb-4"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "1rem",
                    lineHeight: "1.6",
                    fontWeight: "400",
                    opacity: 0.9,
                  }}
                >
                  We couldn't find any theaters matching your search criteria.
                  Try adjusting your filters.
                </p>
                <Button
                  variant="outline-light"
                  className="px-4 py-2 fw-semibold"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCity("");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default Theaters;
