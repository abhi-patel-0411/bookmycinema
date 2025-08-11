import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Card,
  Badge,
  Button,
  Row,
  Col,
} from "react-bootstrap";
import {
  FaFilm,
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaTrash,
  FaEye,
} from "react-icons/fa";
import showsService from "../../services/showsService";
import ModernLoader from "../common/ModernLoader";
import "../../styles/admin-shows-table.css";

const AdminShowsTable = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      setLoading(true);
      // Use direct API call to ensure we get all shows including those with booking closed
      const response = await fetch('http://localhost:5000/api/shows?includeBookingClosed=true');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setShows(Array.isArray(data) ? data : data.shows || data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching shows:", err);
      setError("Failed to load shows");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (show) => {
    const now = new Date();
    const showDateTime = new Date(show.showDate);
    const [hours, minutes] = show.showTime.split(":");
    showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    if (now > showDateTime) {
      return (
        <Badge bg="danger" className="status-badge">
          Expired
        </Badge>
      );
    }

    const availableSeats = show.totalSeats - (show.bookedSeats || 0);
    if (availableSeats < 10) {
      return (
        <Badge bg="warning" className="status-badge">
          Filling Fast
        </Badge>
      );
    }

    return (
      <Badge bg="success" className="status-badge">
        Available
      </Badge>
    );
  };

  if (loading) return <ModernLoader text="Loading Shows" />;

  if (error) {
    return (
      <Container className="admin-shows-container">
        <div className="text-center my-5">
          <p className="text-danger">{error}</p>
          <Button variant="primary" onClick={fetchShows}>
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-shows-container">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <h1 className="admin-title">
            <FaFilm className="title-icon" />
            Shows Management
          </h1>
          <p className="admin-subtitle">
            Manage all movie shows across theaters
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" className="add-btn">
            <FaFilm className="me-2" />
            Add New Show
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="admin-table-card d-none d-lg-block">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <style>
              {`
                .admin-layout ::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                .admin-layout ::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.05);
                  border-radius: 4px;
                }
                .admin-layout ::-webkit-scrollbar-thumb {
                  background: rgba(248, 69, 101, 0.6);
                  border-radius: 4px;
                }
                .admin-layout ::-webkit-scrollbar-thumb:hover {
                  background: rgba(248, 69, 101, 0.8);
                }
                .table-responsive::-webkit-scrollbar {
                  width: 6px;
                  height: 6px;
                }
                .table-responsive::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.05);
                  border-radius: 3px;
                }
                .table-responsive::-webkit-scrollbar-thumb {
                  background: rgba(248, 69, 101, 0.5);
                  border-radius: 3px;
                }
                .table-responsive::-webkit-scrollbar-thumb:hover {
                  background: rgba(248, 69, 101, 0.7);
                }
              `}
            </style>
            <Table className="admin-table table-responsive mb-0 table-striped table-hover">
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
                  <th>Seats</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((show) => (
                  <tr key={show._id} className="table-row">
                    <td>
                      <div className="movie-cell">
                        <img
                          src={show.movie?.poster || "/placeholder-movie.jpg"}
                          alt={show.movie?.title}
                          className="movie-poster"
                        />
                        <div className="movie-details">
                          <div className="movie-title">
                            {show.movie?.title || "N/A"}
                          </div>
                          <small className="movie-genre">
                            {show.movie?.genre || "Unknown"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="theater-cell">
                        <div className="theater-name">
                          {show.theater?.name || "N/A"}
                        </div>
                        <small className="theater-location">
                          {show.theater?.location || show.theater?.city}
                        </small>
                      </div>
                    </td>
                    <td className="date-cell">{formatDate(show.showDate)}</td>
                    <td className="time-cell">{formatTime(show.showTime)}</td>
                    <td>
                      <span className="price-badge">₹{show.price}</span>
                    </td>
                    <td>
                      <div className="seats-cell">
                        <span className="seats-available">
                          {(show.totalSeats || 100) - (show.bookedSeats || 0)}
                        </span>
                        <span className="seats-total">
                          /{show.totalSeats || 100}
                        </span>
                      </div>
                    </td>
                    <td>{getStatusBadge(show)}</td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="action-btn"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="action-btn"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="action-btn"
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
        </Card.Body>
      </Card>

      {/* Mobile Cards */}
      <div className="d-lg-none">
        <Row className="g-3">
          {shows.map((show) => (
            <Col key={show._id} xs={12}>
              <Card className="mobile-show-card">
                <Card.Body>
                  <div className="mobile-show-header">
                    <div className="movie-info">
                      <img
                        src={show.movie?.poster || "/placeholder-movie.jpg"}
                        alt={show.movie?.title}
                        className="mobile-poster"
                      />
                      <div>
                        <h6 className="mobile-movie-title">
                          {show.movie?.title || "N/A"}
                        </h6>
                        <small className="mobile-genre">
                          {show.movie?.genre || "Unknown"}
                        </small>
                      </div>
                    </div>
                    {getStatusBadge(show)}
                  </div>

                  <div className="mobile-details">
                    <div className="detail-item">
                      <FaBuilding className="detail-icon" />
                      <div>
                        <div className="detail-label">Theater</div>
                        <div className="detail-value">
                          {show.theater?.name || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="detail-item">
                      <FaCalendarAlt className="detail-icon" />
                      <div>
                        <div className="detail-label">Date & Time</div>
                        <div className="detail-value">
                          {formatDate(show.showDate)} •{" "}
                          {formatTime(show.showTime)}
                        </div>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">Price</span>
                        <span className="price-badge">₹{show.price}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Seats</span>
                        <span className="seats-info">
                          {(show.totalSeats || 100) - (show.bookedSeats || 0)}/
                          {show.totalSeats || 100}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-actions">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="mobile-action-btn"
                    >
                      <FaEye className="me-1" /> View
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="mobile-action-btn"
                    >
                      <FaEdit className="me-1" /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="mobile-action-btn"
                    >
                      <FaTrash className="me-1" /> Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  );
};

export default AdminShowsTable;
