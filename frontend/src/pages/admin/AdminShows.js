import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Badge,
  InputGroup,
  Table,
} from "react-bootstrap";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaClock,
  FaFilm,
  FaBuilding,
  FaTable,
  FaTh,
} from "react-icons/fa";
import api from "../../services/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import showsService from "../../services/showsService";
import { moviesAPI, theatersAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import ModernLoader from "../../components/common/ModernLoader"
import AdminShowCard from "../../components/admin/AdminShowCard";
import { useSocket } from "../../contexts/SocketContext";

const AdminShows = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(18);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [movieFilter, setMovieFilter] = useState("");
  const [theaterFilter, setTheaterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { connected } = useSocket();

  const [formData, setFormData] = useState({
    movie: "",
    theater: "",
    date: "",
    time: "",
    silverPrice: "150",
    goldPrice: "200",
    premiumPrice: "300",
    screenNumber: "1",
  });

  const [selectedTheater, setSelectedTheater] = useState(null);
  const [viewMode, setViewMode] = useState("cards");

  useEffect(() => {
    fetchShows();
    fetchMovies();
    fetchTheaters();

    // Run automatic cleanup in the background
    const runAutoCleanup = async () => {
      try {
        const response = await api.post("/shows/cleanup");
        console.log(
          `Auto cleanup completed: ${
            response.data.deletedCount || 0
          } shows removed`
        );
      } catch (err) {
        console.error("Auto cleanup failed:", err);
      }
    };

    // Run cleanup when component mounts
    runAutoCleanup();

    // Set up interval for periodic cleanup (every 30 minutes)
    const cleanupInterval = setInterval(runAutoCleanup, 30 * 60 * 1000);

    const handleShowsUpdate = () => {
      fetchShows();
    };

    window.addEventListener("shows-updated", handleShowsUpdate);

    return () => {
      window.removeEventListener("shows-updated", handleShowsUpdate);
      clearInterval(cleanupInterval);
    };
  }, []);

  useEffect(() => {
    if (connected) {
      fetchShows();
    }
  }, [connected]);

  const fetchShows = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent mobile caching
      const timestamp = new Date().getTime();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${apiUrl}/shows?includeBookingClosed=true&admin=true&_t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Shows fetched directly:", data);
      setShows(Array.isArray(data) ? data : data.shows || data.data || []);
    } catch (error) {
      toast.error("Failed to fetch shows. Please try again.");
      console.error("Error fetching shows:", error);
      setShows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const response = await moviesAPI.getAll();
      setMovies(response.data);
    } catch (error) {
      console.error("Failed to fetch movies");
    }
  };

  const fetchTheaters = async () => {
    try {
      const response = await theatersAPI.getAll();
      console.log("Theaters API response:", response.data);
      // Handle both old and new API response formats
      const theatersData =
        response.data.theaters || response.data.data || response.data || [];
      const validTheaters = Array.isArray(theatersData)
        ? theatersData.filter((theater) => theater && theater._id)
        : [];
      console.log(
        "Valid theaters with screens:",
        validTheaters.map((t) => ({ name: t.name, screens: t.screens }))
      );
      setTheaters(validTheaters);
    } catch (error) {
      console.error("Failed to fetch theaters:", error);
      toast.error("Failed to load theaters");
      setTheaters([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.movie ||
      !formData.theater ||
      !formData.date ||
      !formData.time
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const silverPrice = parseInt(formData.silverPrice) || 150;
      const showData = {
        movie: formData.movie,
        theater: formData.theater,
        showDate: formData.date,
        showTime: formData.time,
        price: silverPrice,
        screenNumber: parseInt(formData.screenNumber) || 1,
        pricing: {
          silver: silverPrice,
          gold: parseInt(formData.goldPrice) || Math.round(silverPrice * 1.3),
          premium: parseInt(formData.premiumPrice) || Math.round(silverPrice * 1.8),
        },
      };

      console.log("Submitting show data:", showData);

      if (editingShow) {
        await showsService.update(editingShow._id, showData);
        toast.success("Show updated successfully");
      } else {
        await showsService.create(showData);
        toast.success("Show created successfully");
      }

      handleCloseModal();
      fetchShows();
    } catch (error) {
      console.error("Show save error:", error);
      toast.error(error.response?.data?.message || "Failed to save show");
    }
  };

  const handleEdit = (show) => {
    setEditingShow(show);
    setFormData({
      movie: show.movie?._id || "",
      theater: show.theater?._id || "",
      date: new Date(show.showDate).toISOString().split("T")[0],
      time: show.showTime,
      silverPrice: show.pricing?.silver?.toString() || show.price.toString(),
      goldPrice:
        show.pricing?.gold?.toString() ||
        Math.round(show.price * 1.3).toString(),
      premiumPrice:
        show.pricing?.premium?.toString() ||
        Math.round(show.price * 1.8).toString(),
      screenNumber: show.screenNumber.toString(),
    });
    setSelectedTheater(show.theater);
    setShowModal(true);
  };

  const handleDelete = async (id, showTitle) => {
    const show = shows.find(s => s._id === id);
    const movieTitle = show?.movie?.title || 'Unknown Movie';
    const theaterName = show?.theater?.name || 'Unknown Theater';
    const showDate = show?.showDate ? formatDate(show.showDate) : 'Unknown Date';
    const showTime = show?.showTime ? formatTime(show.showTime) : 'Unknown Time';
    
    const confirmMessage = `Are you sure you want to delete this show?\n\nMovie: ${movieTitle}\nTheater: ${theaterName}\nDate: ${showDate}\nTime: ${showTime}\n\nThis will also cancel all bookings for this show.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await showsService.delete(id);
        toast.success(`Show deleted successfully: ${movieTitle} at ${theaterName}`);
        fetchShows();
      } catch (error) {
        console.error("Error deleting show:", error);
        const errorMessage = error.response?.data?.message || error.message;
        
        // Check if it's a booking conflict
        if (error.response?.status === 400 && error.response?.data?.canForceDelete) {
          const bookingCount = error.response.data.bookingCount;
          const forceConfirm = window.confirm(
            `${errorMessage}\n\nDo you want to FORCE DELETE this show?\n\nThis will:\n• Delete the show permanently\n• Cancel all ${bookingCount} booking(s)\n• Notify affected customers\n\nThis action cannot be undone!`
          );
          
          if (forceConfirm) {
            try {
              await showsService.forceDelete(id);
              toast.success(`Show force deleted and ${bookingCount} booking(s) cancelled`);
              fetchShows();
            } catch (forceError) {
              console.error("Error force deleting show:", forceError);
              toast.error("Failed to force delete show: " + (forceError.response?.data?.message || forceError.message));
            }
          }
        } else {
          toast.error("Failed to delete show: " + errorMessage);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingShow(null);
    setFormData({
      movie: "",
      theater: "",
      date: "",
      time: "",
      silverPrice: "150",
      goldPrice: "200",
      premiumPrice: "300",
      screenNumber: "1",
    });
    setSelectedTheater(null);
  };

  // Filter and search logic
  const filteredShows = shows.filter((show) => {
    // Skip shows without required data
    if (!show || !show.movie || !show.theater) return false;

    // Handle potential null values
    const movieTitle = show.movie?.title || "";
    const theaterName = show.theater?.name || "";

    // Simple search and date filtering
    const matchesSearch =
      searchTerm === "" ||
      movieTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theaterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate =
      !dateFilter ||
      new Date(show.showDate).toISOString().split("T")[0] === dateFilter;

    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentShows = filteredShows.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredShows.length / itemsPerPage);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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

  const isPastShow = (show) => {
    if (!show || !show.showDate || !show.showTime) return false;
    const now = new Date();
    const showDateTime = new Date(show.showDate);
    const [hours, minutes] = show.showTime.split(":");
    showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return now > showDateTime;
  };

  if (loading) {
    return (
      <AdminLayout>
        <ModernLoader/>
      </AdminLayout>
    );
  }

  // Show retry button if shows array is empty
  if (shows.length === 0) {
    return (
      <AdminLayout>
        <Container fluid>
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="gradient-text mb-2">Shows Management</h1>
                  <p className="text-secondary mb-0">
                    Manage movie shows and schedules
                  </p>
                </div>
                <Button
                  className="btn-primary-custom px-4 py-2"
                  onClick={() => setShowModal(true)}
                >
                  <FaPlus className="me-2" />
                  Add New Show
                </Button>
              </div>
            </Col>
          </Row>

          <Card className="admin-card">
            <Card.Body className="p-5 text-center">
              <div className="empty-state">
                <FaCalendarAlt className="empty-state-icon mb-3" size={50} />
                <h4 className="text-white">No Shows Found</h4>
                <p className="text-secondary mb-4">
                  There are no shows available or there was an error loading
                  them.
                </p>
                <Button
                  variant="primary"
                  onClick={fetchShows}
                  className="px-4 py-2"
                >
                  Retry Loading Shows
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Add/Edit Modal */}
          <Modal
            show={showModal}
            onHide={handleCloseModal}
            size="lg"
            className="admin-modal"
          >
            <Modal.Header
              closeButton
              className="border-0"
              style={{ background: "#1f2025", borderBottom: "1px solid #6c757d" }}
            >
              <Modal.Title className="text-white fw-bold">
                <FaCalendarAlt className="me-2 text-primary" />
                {editingShow ? "Edit Show" : "Add New Show"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: "#1f2025" }}>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">Movie</Form.Label>
                      <Form.Select
                        value={formData.movie}
                        onChange={(e) =>
                          setFormData({ ...formData, movie: e.target.value })
                        }
                        className="bg-dark border-secondary text-white"
                        required
                      >
                        <option value="">Select Movie</option>
                        {movies.map((movie) => (
                          <option key={movie._id} value={movie._id}>
                            {movie.title}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white d-flex justify-content-between align-items-center">
                        Theater
                        {(!Array.isArray(theaters) ||
                          theaters.length === 0) && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={fetchTheaters}
                            className="ms-2"
                          >
                            Reload Theaters
                          </Button>
                        )}
                      </Form.Label>
                      <Form.Select
                        value={formData.theater}
                        onChange={(e) => {
                          const theaterId = e.target.value;
                          const theater = theaters.find(
                            (t) => t._id === theaterId
                          );
                          console.log("Selected theater:", theater);
                          console.log("Theater screens:", theater?.screens);
                          setFormData({
                            ...formData,
                            theater: theaterId,
                            screenNumber: "1",
                          });
                          setSelectedTheater(theater);
                        }}
                        className="bg-dark border-secondary text-white"
                        required
                      >
                        <option value="">Select Theater</option>
                        {Array.isArray(theaters) && theaters.length > 0 ? (
                          theaters.map((theater) => (
                            <option key={theater._id} value={theater._id}>
                              {theater.name} -{" "}
                              {theater.address?.city ||
                                theater.city ||
                                "Unknown City"}
                            </option>
                          ))
                        ) : (
                          <option disabled>
                            No theaters available - Click "Reload Theaters"
                          </option>
                        )}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="bg-dark border-secondary text-white"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                        className="bg-dark border-secondary text-white"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">Screen</Form.Label>
                      {selectedTheater?.screens &&
                      selectedTheater.screens.length > 0 ? (
                        <Form.Select
                          value={formData.screenNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              screenNumber: e.target.value,
                            })
                          }
                          className="bg-dark border-secondary text-white"
                          required
                        >
                          {selectedTheater.screens.map((screen) => (
                            <option
                              key={screen.screenNumber}
                              value={screen.screenNumber}
                            >
                              {screen.name || `Screen ${screen.screenNumber}`}
                            </option>
                          ))}
                        </Form.Select>
                      ) : (
                        <Form.Control
                          type="number"
                          min="1"
                          value={formData.screenNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              screenNumber: e.target.value,
                            })
                          }
                          className="bg-dark border-secondary text-white"
                          placeholder="Screen Number"
                          required
                        />
                      )}
                    </Form.Group>
                  </Col>

                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">
                        Silver Price (₹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.silverPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            silverPrice: e.target.value,
                          })
                        }
                        className="bg-dark border-secondary text-white"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">
                        Gold Price (₹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.goldPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            goldPrice: e.target.value,
                          })
                        }
                        className="bg-dark border-secondary text-white"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">
                        Premium Price (₹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.premiumPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            premiumPrice: e.target.value,
                          })
                        }
                        className="bg-dark border-secondary text-white"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Modal.Body>
            <Modal.Footer
              className="border-0"
              style={{ background: "#1f2025", borderTop: "1px solid #6c757d" }}
            >
              <Button
                variant="outline-secondary"
                onClick={handleCloseModal}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                className="btn-primary-custom px-4"
                onClick={handleSubmit}
              >
                {editingShow ? "Update Show" : "Add Show"}
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container fluid style={{ background: "#1f2025" }}>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="text-white mb-1">Shows Management</h2>
                <p className="text-secondary mb-0">
                  Manage movie shows and schedules
                </p>
              </div>
              <div className="d-flex gap-2">
                <div className="btn-group" role="group">
                  <Button
                    variant={
                      viewMode === "table" ? "primary" : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setViewMode("table")}
                    title="Table View"
                  >
                    <FaTable />
                  </Button>
                  <Button
                    variant={
                      viewMode === "cards" ? "primary" : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    title="Card View"
                  >
                    <FaTh />
                  </Button>
                </div>
                <Button
                  className="btn-primary-custom px-4 py-2"
                  onClick={() => setShowModal(true)}
                >
                  <FaPlus className="me-2" />
                  Add New Show
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Filters - with border-bottom and no background */}
        <div
          className="filters-container mb-4 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <h5 className="text-white mb-2 mb-md-0 d-flex align-items-center">
              <FaFilter className="me-2 text-primary" />
              Filter Shows
            </h5>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setDateFilter("");
              }}
            >
              Clear All Filters
            </Button>
          </div>
          <Row className="g-3">
            <Col lg={6} md={8} xs={12}>
              <div
                className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden"
                style={{ height: "46px" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 30 30"
                  fill="#6B7280"
                >
                  <path d="M13 3C7.489 3 3 7.489 3 13s4.489 10 10 10a9.95 9.95 0 0 0 6.322-2.264l5.971 5.971a1 1 0 1 0 1.414-1.414l-5.97-5.97A9.95 9.95 0 0 0 23 13c0-5.511-4.489-10-10-10m0 2c4.43 0 8 3.57 8 8s-3.57 8-8 8-8-3.57-8-8 3.57-8 8-8" />
                </svg>
                <Form.Control
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 bg-transparent w-100 h-100 ms-2"
                  style={{
                    outline: "none",
                    boxShadow: "none",
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: "400",
                  }}
                />
              </div>
            </Col>

            <Col lg={4} md={4} xs={12}>
              <div
                className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden"
                style={{ height: "46px" }}
              >
                <FaCalendarAlt className="text-secondary" />
                <Form.Control
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border-0 bg-transparent w-100 h-100 ms-2"
                  style={{
                    outline: "none",
                    boxShadow: "none",
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: "400",
                  }}
                />
              </div>
            </Col>
            <Col lg={2} md={12} xs={12}>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                }}
                className="w-100 rounded-pill"
                style={{ height: "46px" }}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </div>

        {/* Hidden cleanup functionality */}
        <div style={{ display: "none" }}>
          <button
            id="hidden-cleanup-btn"
            onClick={async () => {
              try {
                const response = await api.post("/shows/cleanup");
                console.log(
                  `Cleanup completed: ${
                    response.data.deletedCount || 0
                  } shows removed`
                );
              } catch (err) {
                console.error("Cleanup failed:", err);
              }
            }}
          ></button>
        </div>

        {/* Shows Display */}
        {currentShows.length > 0 ? (
          <>
            {viewMode === "cards" ? (
              <div
                className="cards-container mb-4 pb-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Row className="g-3">
                  <AnimatePresence>
                    {currentShows.map((show, index) => (
                      <Col key={show._id} lg={4} md={6} sm={12}>
                        <AdminShowCard
                          show={show}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          index={index}
                        />
                      </Col>
                    ))}
                  </AnimatePresence>
                </Row>
              </div>
            ) : (
              <div
                className="table-container mb-4 pb-3"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  background: "#1f2025",
                  borderRadius: "20px",
                  overflow: "hidden",
                }}
              >
                <div className="table-responsive">
                  <Table
                    className="admin-table mb-0"
                    striped
                    bordered
                    hover
                    variant="dark"
                    style={{ borderRadius: "20px", overflow: "hidden" }}
                  >
                    <thead>
                      <tr>
                        <th>
                          <FaFilm className="me-2" />
                          Movie
                        </th>
                        <th>
                          <FaBuilding className="me-2" />
                          Theater
                        </th>
                        <th>
                          <FaCalendarAlt className="me-2" />
                          Date
                        </th>
                        <th>
                          <FaClock className="me-2" />
                          Time
                        </th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentShows.map((show) => (
                        <tr key={show._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={
                                  show.movie?.poster ||
                                  "https://via.placeholder.com/40x60"
                                }
                                alt={show.movie?.title}
                                style={{
                                  width: "30px",
                                  height: "40px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                }}
                                className="me-3"
                              />
                              <div>
                                <div className="fw-bold text-white">
                                  {show.movie?.title}
                                </div>
                                <small className="text-secondary">
                                  {show.movie?.genre?.join(", ")}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="text-white">
                              {show.theater?.name}
                            </div>
                            <small className="text-secondary">
                              {show.theater?.location || show.theater?.city}
                            </small>
                          </td>
                          <td className="text-white">
                            {formatDate(show.showDate)}
                          </td>
                          <td className="text-white">
                            {formatTime(show.showTime)}
                          </td>
                          <td>
                            <Badge bg="success" className="price-badge">
                              ₹{show.price}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              bg={isPastShow(show) ? "secondary" : "primary"}
                            >
                              {isPastShow(show) ? "Past" : "Active"}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEdit(show)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(show._id, show.movie?.title)}
                                title="Delete Show"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            {/* Professional Mobile Pagination */}
            {totalPages > 1 && (
              <div className="mt-3 p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-light">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredShows.length)} of {filteredShows.length}</small>
                  <small className="text-primary">{currentPage}/{totalPages}</small>
                </div>
                <div className="d-flex justify-content-center gap-1">
                  <button className="btn btn-outline-light btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ width: '32px', height: '32px', padding: '0', fontSize: '14px' }}>‹</button>
                  {(() => {
                    const c = currentPage, t = totalPages;
                    if (t <= 5) return Array.from({length: t}, (_, i) => i + 1);
                    if (c <= 3) return [1, 2, 3, '...', t];
                    if (c >= t - 2) return [1, '...', t - 2, t - 1, t];
                    return [1, '...', c - 1, c, c + 1, '...', t];
                  })().map((p, i) => 
                    p === '...' ? <span key={i} className="px-1 text-secondary">...</span> :
                    <button key={p} className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-outline-light'}`} onClick={() => setCurrentPage(p)} style={{ width: '32px', height: '32px', padding: '0', fontSize: '12px' }}>{p}</button>
                  )}
                  <button className="btn btn-outline-light btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ width: '32px', height: '32px', padding: '0', fontSize: '14px' }}>›</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-5 mb-4"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              background: "#1f2025",
            }}
          >
            <FaCalendarAlt
              className="text-primary mb-3"
              size={50}
              style={{ opacity: 0.5 }}
            />
            <h4 className="text-white mb-3">No Shows Found</h4>
            <p className="text-secondary mb-4">
              {searchTerm || dateFilter
                ? "Try adjusting your search criteria"
                : "Start by adding your first show"}
            </p>
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              className="px-4 py-2"
            >
              <FaPlus className="me-2" />
              Add Your First Show
            </Button>
          </motion.div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          show={showModal}
          onHide={handleCloseModal}
          size="lg"
          className="admin-modal"
        >
          <Modal.Header
            closeButton
            className="border-0"
            style={{ background: "#1f2025", borderBottom: "1px solid #6c757d" }}
          >
            <Modal.Title className="text-white fw-bold">
              <FaCalendarAlt className="me-2 text-primary" />
              {editingShow ? "Edit Show" : "Add New Show"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: "#1f2025" }}>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Movie</Form.Label>
                    <Form.Select
                      value={formData.movie}
                      onChange={(e) =>
                        setFormData({ ...formData, movie: e.target.value })
                      }
                      className="bg-dark border-secondary text-white"
                      required
                    >
                      <option value="">Select Movie</option>
                      {movies.map((movie) => (
                        <option key={movie._id} value={movie._id}>
                          {movie.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Theater</Form.Label>
                    <Form.Select
                      value={formData.theater}
                      onChange={(e) => {
                        const theaterId = e.target.value;
                        const theater = theaters.find(
                          (t) => t._id === theaterId
                        );
                        console.log('Selected theater with screens:', theater?.screens);
                        setFormData({
                          ...formData,
                          theater: theaterId,
                          screenNumber: "",
                        });
                        setSelectedTheater(theater);
                      }}
                      className="bg-dark border-secondary text-white"
                      required
                    >
                      <option value="">Select Theater</option>
                      {Array.isArray(theaters) &&
                        theaters.map((theater) => (
                          <option key={theater._id} value={theater._id}>
                            {theater.name}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="bg-dark border-secondary text-white"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="bg-dark border-secondary text-white"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Screen</Form.Label>
                    <Form.Select
                      value={formData.screenNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          screenNumber: e.target.value,
                        })
                      }
                      className="bg-dark border-secondary text-white"
                      required
                    >
                      <option value="">Select Screen</option>
                      {selectedTheater?.screens &&
                      selectedTheater.screens.length > 0
                        ? selectedTheater.screens.map((screen) => (
                            <option
                              key={screen.screenNumber || screen._id}
                              value={screen.screenNumber}
                            >
                              {screen.name || `Screen ${screen.screenNumber}`}
                            </option>
                          ))
                        : [1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>
                              Screen {num}
                            </option>
                          ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

              </Row>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">
                      Silver Price (₹)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.silverPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          silverPrice: e.target.value,
                        })
                      }
                      className="bg-dark border-secondary text-white"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">
                      Gold Price (₹)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.goldPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, goldPrice: e.target.value })
                      }
                      className="bg-dark border-secondary text-white"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">
                      Premium Price (₹)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.premiumPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          premiumPrice: e.target.value,
                        })
                      }
                      className="bg-dark border-secondary text-white"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer
            className="border-0"
            style={{ background: "#1f2025", borderTop: "1px solid #6c757d" }}
          >
            <Button
              variant="outline-secondary"
              onClick={handleCloseModal}
              className="px-4"
            >
              Cancel
            </Button>
            <Button className="btn-primary-custom px-4" onClick={handleSubmit}>
              {editingShow ? "Update Show" : "Add Show"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AdminLayout>
  );
};

export default AdminShows;
