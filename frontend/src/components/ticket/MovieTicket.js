import React from "react";
import {
  FaFilm,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaCouch,
  FaStar,
} from "react-icons/fa";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import moment from "moment";
import BrandLogo from "../common/BrandLogo";
import "./MovieTicket.css";

const MovieTicket = ({ booking }) => {
  const generateUniqueTicketId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  };

  const ticketId = booking?.ticketId || generateUniqueTicketId();

  // Generate QR code data with booking details
  const qrData = `TICKET:${ticketId}|BOOKING:${booking?.bookingId}|MOVIE:${
    booking?.show?.movie?.title
  }|THEATER:${booking?.show?.theater?.name}|DATE:${
    booking?.show?.showDate
  }|TIME:${booking?.show?.showTime}|SEATS:${booking?.seats?.join(",")}|AMOUNT:${
    booking?.totalAmount
  }`;

  return (
    <div className="container-fluid p-4">
      <Card
        className="border-0 shadow-lg"
        style={{
          background: "#1f2025",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        {/* linear-gradient(135deg, #667eea 0%, #764ba2 100%) */}
        <Card.Body className="p-0">
          <Row className="g-0">
            {/* Left Section - QR & Basic Info */}
            <Col
              lg={4}
              className="bg-white p-4 d-flex flex-column align-items-center justify-content-center"
            >
              <div className="text-center mb-4">
                <div className="mb-1">
                  <BrandLogo className="ticket-logo" />
                </div>
                <p
                  className="small mb-0"
                  style={{ color: "#000000", fontWeight: "600" }}
                >
                  Digital Ticket
                </p>
              </div>

              <div className="mb-4">
                <QRCode
                  value={qrData}
                  size={150}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <div className="text-center">
                <Badge bg="primary" className="px-3 py-2 rounded-pill mb-2">
                  <FaTicketAlt className="me-2" />
                  {ticketId}
                </Badge>
                <p className="text-muted small mb-0">Scan for entry</p>
              </div>
            </Col>

            {/* Right Section - Movie Details */}
            <Col lg={8} className="text-white p-4">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <FaFilm className="text-warning me-2" size={20} />
                  <h2 className="mb-0">
                    {booking.show?.movie?.title ||
                      booking.movieTitle ||
                      "Movie"}
                  </h2>
                  {booking.show?.movie &&
                    booking.show.movie.isActive === false && (
                      <Badge
                        bg="secondary"
                        className="ms-2"
                        style={{ fontSize: "0.75rem" }}
                      >
                        No Longer Available
                      </Badge>
                    )}
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg="warning" text="dark" className="me-2">
                    {Array.isArray(booking.show?.movie?.genre)
                      ? booking.show?.movie?.genre[0]
                      : booking.show?.movie?.genre || "Movie"}
                  </Badge>
                  <div className="d-flex align-items-center text-warning">
                    <FaStar className="me-1" size={14} />
                    <span className="small">
                      {booking.show?.movie?.rating || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaMapMarkerAlt className="text-info me-2" />
                      <h6 className="mb-0 text-light">Theater</h6>
                    </div>
                    <p className="mb-0 h5">
                      {booking.show?.theater?.name || "Theater"}
                    </p>
                    <small className="text-light opacity-75">
                      Screen{" "}
                      {booking.show?.theater?.screen ||
                        booking.show?.screenNumber ||
                        booking.show?.screen ||
                        "N/A"}
                    </small>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaCouch className="text-success me-2" />
                      <h6 className="mb-0 text-light">Seats</h6>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {booking.seats?.map((seat, index) => (
                        <Badge
                          key={index}
                          bg="success"
                          className="px-3 py-2 rounded"
                        >
                          {seat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaCalendarAlt className="text-warning me-2" />
                      <h6 className="mb-0 text-light">Show Date</h6>
                    </div>
                    <p className="mb-0 h5">
                      {booking.show?.showDate
                        ? moment(booking.show.showDate).format("MMM DD, YYYY")
                        : "N/A"}
                    </p>
                    <small className="text-light opacity-75">
                      {booking.show?.showDate
                        ? moment(booking.show.showDate).format("dddd")
                        : ""}
                    </small>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaClock className="text-info me-2" />
                      <h6 className="mb-0 text-light">Show Time</h6>
                    </div>
                    <p className="mb-0 h5">{booking.show?.showTime || "N/A"}</p>
                  </div>
                </Col>
              </Row>

              <div className="mt-4 pt-3 border-top border-light border-opacity-25">
                <Row className="align-items-center">
                  <Col>
                    <div className="d-flex align-items-center">
                      <span className="text-light me-2">Total Amount:</span>
                      <h4 className="mb-0 text-warning">
                        ₹{booking.totalAmount}
                      </h4>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <Badge bg="success" className="px-3 py-2">
                      {booking.status?.toUpperCase() || "CONFIRMED"}
                    </Badge>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MovieTicket;
