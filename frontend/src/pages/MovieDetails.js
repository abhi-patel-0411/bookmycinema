import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Badge,
  Card,
  Modal,
  ProgressBar,
  Form,
  Alert,
} from "react-bootstrap";
import { motion } from "framer-motion";
import {
  FaStar,
  FaPlay,
  FaTimes,
  FaShare,
  FaComment,
  FaChevronRight,
  FaHome,
  FaSearch,
  FaCompass,
  FaPaperPlane,
  FaUser,
  FaArrowLeft,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { moviesAPI } from "../services/api";
import ModernLoader from "../components/common/ModernLoader";
import { useAuth } from "@clerk/clerk-react";
import { getMoviePosterUrl, getCastImageUrl } from "../utils/imageUtils";

const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, user, getToken } = useAuth();
  const reviewsRef = useRef(null);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [showAlert, setShowAlert] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMovie();
    fetchRatings();
    if (isSignedIn) {
      fetchUserRating();
    }
  }, [id, isSignedIn]);

  const fetchMovie = async () => {
    try {
      const response = await moviesAPI.getById(id);
      const movieData = response.data;

      // Redirect to movies page if movie is expired/inactive
      if (!movieData || !movieData.isActive) {
        console.error("Movie is no longer available");
        navigate("/movies");
        return;
      }

      setMovie(movieData);
    } catch (error) {
      console.error("Error fetching movie:", error);
      navigate("/movies");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle booking tickets with pre-selected city
  const handleBookTickets = () => {
    // Get the theater city from localStorage if available
    const theaterCity = localStorage.getItem("selectedTheaterCity");

    // Navigate to showtimes page with city query parameter if available
    if (theaterCity) {
      navigate(
        `/movie/${movie._id}/showtimes?city=${encodeURIComponent(theaterCity)}`
      );
    } else {
      navigate(`/movie/${movie._id}/showtimes`);
    }
  };

  const fetchRatings = async () => {
    try {
      const timestamp = new Date().getTime();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${apiUrl}/ratings/movie/${id}?_t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(data.ratings || []);
        setAverageRating(parseFloat(data.averageRating) || 0);
        setTotalRatings(data.totalRatings || 0);
      } else {
        setReviews([]);
        setAverageRating(0);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
      setReviews([]);
      setAverageRating(0);
      setTotalRatings(0);
    }
  };

  const fetchUserRating = async () => {
    try {
      const token = await getToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${apiUrl}/ratings/movie/${id}/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setUserRating(data.rating);
          setNewReview({ rating: data.rating, comment: data.comment });
        }
      }
    } catch (error) {
      console.error("Error fetching user rating:", error);
    }
  };

  const submitReview = async () => {
    if (!isSignedIn) {
      setShowAlert({
        show: true,
        message: "Please sign in to submit a review",
        type: "warning",
      });
      setTimeout(() => setShowAlert({ show: false }), 3000);
      return;
    }

    if (newReview.rating === 0 || !newReview.comment.trim()) {
      setShowAlert({
        show: true,
        message: "Please provide both rating and comment",
        type: "warning",
      });
      setTimeout(() => setShowAlert({ show: false }), 3000);
      return;
    }

    try {
      const token = await getToken();

      // Get current user data to include in the review
      const userFullName =
        user?.fullName ||
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        user?.username ||
        user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
        "User";

      const userImageUrl = user?.imageUrl || user?.profileImageUrl || null;

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${apiUrl}/ratings/movie/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({
            rating: newReview.rating,
            comment: newReview.comment.trim(),
            // These will be used by the backend if needed
            userName: userFullName,
            userImage: userImageUrl,
          }),
        }
      );

      if (response.ok) {
        setNewReview({ rating: 0, comment: "" });
        setUserRating(0);
        fetchRatings();
        setShowAlert({
          show: true,
          message: "Review submitted successfully!",
          type: "success",
        });
        setTimeout(() => setShowAlert({ show: false }), 3000);
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (error) {
      setShowAlert({
        show: true,
        message: "Failed to submit review",
        type: "danger",
      });
      setTimeout(() => setShowAlert({ show: false }), 3000);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    );
    return videoId
      ? `https://www.youtube.com/embed/${videoId[1]}?autoplay=1&rel=0&modestbranding=1&fs=1`
      : null;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: movie.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    }
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const calculateRatingBreakdown = () => {
    if (reviews.length === 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
    });

    Object.keys(breakdown).forEach((key) => {
      breakdown[key] = Math.round((breakdown[key] / reviews.length) * 100);
    });

    return breakdown;
  };

  if (loading) return <ModernLoader text="Loading Movie Details" />;
  if (!movie)
    return <div className="text-center text-white mt-5">Movie not found</div>;

  const ratingBreakdown = calculateRatingBreakdown();

  return (
    <div style={{ backgroundColor: "#1f2025", minHeight: "100vh" }}>
      {/* Desktop Hero Section - Exact BMS Layout */}
      <section
        className="d-none d-md-block"
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(26, 26, 26) 24.97%, rgb(26, 26, 26) 38.3%, rgba(26, 26, 26, 0.04) 97.47%, rgb(26, 26, 26) 100%), url(${getMoviePosterUrl(
            movie.poster,
            movie.title
          )})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "80vh",
          paddingTop: "100px",
        }}
      >
        <Container fluid className="h-100">
          <Row className="h-100 align-items-center">
            <Col lg={8}>
              <Row>
                <Col md={4}>
                  {/* Poster Section */}
                  <div className="position-relative">
                    <div
                      className="position-relative overflow-hidden d-flex justify-content-center"
                      style={{ borderRadius: "16px 16px 0px 0px" }}
                    >
                      <img
                        src={getMoviePosterUrl(movie.poster, movie.title)}
                        alt={movie.title}
                        style={{
                          width: "280px",
                          height: "416px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.src = "https://picsum.photos/280/416";
                        }}
                      />
                    </div>
                    {/* Trailer and Book Ticket Buttons */}
                    <div
                      className="position-absolute bottom-0 start-0 d-flex gap-2 m-2"
                      style={{ zIndex: 10 }}
                    >
                      {(movie.youtubeUrl || movie.trailer) && (
                        <div
                          className="d-flex align-items-center gap-1 text-white px-2 py-1 rounded"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.7)",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                          onClick={() => setShowTrailerModal(true)}
                        >
                          <FaPlay size={10} />
                          <span>Trailer</span>
                        </div>
                      )}
                    </div>
                    {/* In Cinemas Badge */}
                    {/* <div
                      className="position-absolute top-0 end-0 text-white px-2 py-1 m-2"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        fontSize: "12px",
                        borderRadius: "4px",
                        zIndex: 10,
                      }}
                    >
                      <span>In cinemas</span>
                    </div> */}
                  </div>
                </Col>

                <Col md={8}>
                  {/* Movie Title */}
                  <h1
                    className="text-white fw-bold mb-4"
                    style={{ fontSize: "3rem" }}
                  >
                    {movie.title}
                  </h1>

                  {/* Rating Section */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={
                                star <= Math.round(averageRating)
                                  ? "text-warning"
                                  : "text-secondary"
                              }
                              size={20}
                            />
                          ))}
                        </div>
                        <h5 className="text-white mb-0 fw-semibold ms-2">
                          {averageRating.toFixed(1)}/5
                        </h5>
                        <h6 className="text-light mb-0">
                          ({totalRatings} Votes)
                        </h6>
                        <FaChevronRight className="text-light" size={12} />
                      </div>
                    </div>
                    <Button
                      variant="outline-light"
                      size="sm"
                      className="px-3 py-1"
                      style={{ fontSize: "14px" }}
                      onClick={scrollToReviews}
                    >
                      Rate now
                    </Button>
                  </div>

                  {/* Format Tags */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Badge
                        className="px-2 py-1 text-decoration-none"
                        style={{
                          backgroundColor: "transparent",
                          border: "1px solid #666",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      >
                        2D
                      </Badge>
                      <Badge
                        className="px-2 py-1 text-decoration-none"
                        style={{
                          backgroundColor: "transparent",
                          border: "1px solid #666",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      >
                        Hindi
                      </Badge>
                    </div>
                  </div>

                  {/* Movie Meta */}
                  <div
                    className="d-flex align-items-center gap-2 mb-4 text-light flex-wrap"
                    style={{ fontSize: "14px" }}
                  >
                    <span>{movie.duration || "2h 32m"}</span>
                    <span>•</span>
                    <span className="text-danger text-decoration-none">
                      {Array.isArray(movie.genre)
                        ? movie.genre.join(", ")
                        : movie.genre || "Action, Crime, Drama, Period"}
                    </span>
                    <span>•</span>
                    <span>A</span>
                    <span>•</span>
                    <span>
                      {new Date(movie.releaseDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) || "11 Jul, 2025"}
                    </span>
                  </div>

                  {/* Book Tickets Button */}
                  <div className="mb-4">
                    <Button
                      variant="danger"
                      className="px-5 py-3 fw-semibold"
                      style={{
                        fontSize: "16px",
                        borderRadius: "8px",
                        fontWeight: "500",
                      }}
                      onClick={handleBookTickets}
                    >
                      Book tickets
                    </Button>
                    {(movie.youtubeUrl || movie.trailer) && (
                      <button
                        type="button"
                        className="px-5 py-3 fw-semibold btn btn-outline-light ms-3"
                        style={{
                          fontSize: "16px",
                          borderRadius: "8px",
                          fontWeight: "500",
                        }}
                        onClick={() => setShowTrailerModal(true)}
                      >
                        Watch Trailer
                      </button>
                    )}
                  </div>
                </Col>
              </Row>
            </Col>

            {/* Share Section */}
            {/* <Col lg={4} className="text-center">
              <div className="d-flex justify-content-center gap-4">
                <div
                  className="d-flex flex-column align-items-center gap-2 text-white"
                  style={{ cursor: "pointer" }}
                  onClick={handleShare}
                >
                  <FaShare size={32} />
                  <div style={{ fontSize: "14px" }}>Share</div>
                </div>
              </div>
            </Col> */}
          </Row>
        </Container>
      </section>

      {/* Mobile Movie Info Section */}
      <div
        className="d-md-none"
        style={{ paddingTop: "80px", paddingBottom: "80px" }}
      >
        {/* Mobile Trailer Banner - Full Width */}
        <section className="position-relative mx-3 mb-3">
          <div className="position-relative" style={{ width: "100%" }}>
            <div
              style={{
                height: "240px",
                width: "100%",
                background: "none",
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <img
                src={getMoviePosterUrl(movie.poster, movie.title)}
                alt="multimedia-trailers"
                style={{
                  opacity: 1,
                  objectFit: "cover",
                  width: "100%",
                  height: "240px",
                }}
                onError={(e) => {
                  e.target.src = "https://picsum.photos/300/400";
                }}
              />
            </div>

            {/* Trailer and Book Ticket Buttons */}
            <div
              className="position-absolute d-flex gap-2"
              style={{ bottom: "12px", left: "12px", right: "12px" }}
            >
              {(movie.youtubeUrl || movie.trailer) && (
                <div
                  className="d-flex align-items-center gap-1 text-white px-2 py-1"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    minWidth: "fit-content",
                  }}
                  onClick={() => setShowTrailerModal(true)}
                >
                  <FaPlay size={10} />
                  <span>Trailer</span>
                </div>
              )}
              <button
                type="button"
                className="px-3 py-2 fw-semibold btn btn-danger flex-grow-1"
                style={{
                  fontSize: "13px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  minHeight: "36px",
                }}
                onClick={handleBookTickets}
              >
                Book Tickets
              </button>
            </div>

            {/* In Cinemas Badge */}
            <div
              className="position-absolute d-flex align-items-center px-3 py-2 text-white"
              style={{
                top: "12px",
                right: "12px",
                backgroundColor: "rgba(229, 9, 20, 0.9)",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              <span>In Cinemas</span>
            </div>
          </div>
        </section>

        {/* Mobile Movie Info */}
        <section className="px-3 py-3">
          <div className="mb-3">
            <h1
              className="text-white fw-bold mb-3"
              style={{ fontSize: "1.75rem", lineHeight: "1.2" }}
            >
              {movie.title}
            </h1>

            {/* Mobile Rating */}
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={
                        star <= Math.round(averageRating)
                          ? "text-warning"
                          : "text-secondary"
                      }
                      size={16}
                    />
                  ))}
                </div>
                <span
                  className="text-white fw-bold"
                  style={{ fontSize: "16px" }}
                >
                  {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}/5
                </span>
              </div>
              <small className="text-light">({totalRatings} votes)</small>
            </div>

            {/* Mobile Format Tags */}
            <div className="d-flex gap-2 mb-3">
              <span
                className="px-3 py-1 text-white fw-semibold"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: "12px",
                  borderRadius: "6px",
                }}
              >
                2D
              </span>
              <span
                className="px-3 py-1 text-white fw-semibold"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: "12px",
                  borderRadius: "6px",
                }}
              >
                HINDI
              </span>
            </div>

            {/* Mobile Meta */}
            <div className="text-light mb-3" style={{ fontSize: "14px" }}>
              <span className="me-2">{movie.duration || "2h 32m"}</span>
              <span className="me-2">•</span>
              <span className="me-2">
                {Array.isArray(movie.genre) ? movie.genre.join(", ") : "Action"}
              </span>
              <span className="me-2">•</span>
              <span>A</span>
            </div>
          </div>
        </section>

        {/* Mobile Movie Description */}
        <motion.section
          className="px-3 pb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="p-3 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h6 className="text-white mb-2 fw-semibold">About the Movie</h6>
            <p
              className="text-light mb-0"
              style={{ fontSize: "14px", lineHeight: "1.6" }}
            >
              {movie.description || "Power. Loyalty. Betrayal. One man's rise to rule it all. A gripping gangster action thriller that will keep you on the edge of your seat."}
            </p>
          </motion.div>
        </motion.section>
      </div>

      {/* Movie Details Section - BMS Style */}
      <section
        style={{ backgroundColor: "#1f2025" }}
        className="py-4 d-none d-md-block"
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Format Tags */}
            <div className="mb-3">
              <div className="d-flex gap-2">
                <div className="d-flex align-items-center">
                  <span
                    className="px-3 py-1 text-white fw-semibold"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #666",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  >
                    2D
                  </span>
                </div>
                <div className="d-flex align-items-center">
                  <span
                    className="px-3 py-1 text-white fw-semibold"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #666",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  >
                    HINDI
                  </span>
                </div>
              </div>
            </div>

            {/* Movie Meta Info */}
            <div className="mb-3">
              <span
                className="text-light"
                style={{ fontSize: "14px", lineHeight: "1.4" }}
              >
                {movie.duration || "2h 32m"} •{" "}
                {Array.isArray(movie.genre)
                  ? movie.genre.join(", ")
                  : "Action, Crime, Drama, Period"}{" "}
                • A •{" "}
                {new Date(movie.releaseDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }) || "11 Jul, 2025"}
              </span>
            </div>

            {/* Movie Description */}
            <div className="mb-4">
              <span
                className="text-light"
                style={{ fontSize: "14px", lineHeight: "1.6" }}
              >
                {movie.description || "Power. Loyalty. Betrayal. One man's rise to rule it all. A gripping gangster action thriller that will keep you on the edge of your seat."}
              </span>
            </div>
          </motion.div>
        </Container>
      </section>



      {/* Reviews Section */}
      <Container className="py-3" ref={reviewsRef}>
        <div className="text-center mb-3">
          <FaComment className="text-danger mb-2" size={24} />
          <h4 className="text-white fw-bold mb-1">User Reviews</h4>
          <p className="text-light mb-0" style={{ fontSize: "14px" }}>
            What our audience thinks about this movie
          </p>
        </div>

        <Row>
          <Col md={8}>
            {/* Add Review Form */}
            {isSignedIn && (
              <Card
                className="border-0 text-white shadow mb-3"
                style={{ backgroundColor: "#1f2025" }}
              >
                <Card.Body className="p-3">
                  <h6 className="text-white mb-2">Write a Review</h6>

                  <div className="d-flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={
                          star <= newReview.rating
                            ? "text-warning"
                            : "text-muted"
                        }
                        onClick={() =>
                          setNewReview({ ...newReview, rating: star })
                        }
                        style={{ cursor: "pointer", fontSize: "1.2rem" }}
                      />
                    ))}
                  </div>

                  <Form.Control
                    as="textarea"
                    rows={2}
                    className="border-secondary text-white mb-2"
                    style={{ backgroundColor: "#1f2025", fontSize: "13px" }}
                    placeholder="Share your thoughts..."
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview({ ...newReview, comment: e.target.value })
                    }
                  />

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={submitReview}
                    disabled={
                      newReview.rating === 0 || newReview.comment.length < 5
                    }
                  >
                    Submit
                  </Button>
                </Card.Body>
              </Card>
            )}

            {showAlert.show && (
              <Alert variant={showAlert.type} className="mb-3">
                {showAlert.message}
              </Alert>
            )}

            {/* Reviews List */}
            {reviews.map((review, index) => (
              <div
                key={review._id || index}
                className="border-bottom border-secondary pb-2 mb-3"
              >
                <div className="d-flex align-items-center mb-2">
                  <img
                    className="rounded-circle me-2"
                    src={
                      review.userImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        review.userName || "User"
                      )}&background=random&color=fff&size=32`
                    }
                    alt={review.userName || "User"}
                    style={{ width: "32px", height: "32px" }}
                  />
                  <div>
                    <div className="d-flex align-items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={
                            star <= review.rating
                              ? "text-warning"
                              : "text-muted"
                          }
                          size={12}
                        />
                      ))}
                      <span
                        className="text-white ms-1"
                        style={{ fontSize: "13px" }}
                      >
                        {review.userName || "Anonymous User"}
                      </span>
                    </div>
                    <small className="text-muted">
                      {new Date(
                        review.createdAt || Date.now()
                      ).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <p className="text-light mb-0" style={{ fontSize: "13px" }}>
                  "{review.comment}"
                </p>
              </div>
            ))}
          </Col>

          <Col md={4}>
            <Card
              className="border-0 text-white shadow"
              style={{ backgroundColor: "#1f2025" }}
            >
              <Card.Body className="p-3">
                <h6 className="text-white mb-3">Rating Breakdown</h6>

                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="d-flex align-items-center mb-2">
                    <span
                      className="text-white me-2"
                      style={{ fontSize: "12px" }}
                    >
                      {rating} ★
                    </span>
                    <ProgressBar
                      now={ratingBreakdown[rating] || 0}
                      className="flex-grow-1 me-2"
                      style={{ height: "6px" }}
                      variant="danger"
                    />
                    <span className="text-light" style={{ fontSize: "11px" }}>
                      {ratingBreakdown[rating] || 0}%
                    </span>
                  </div>
                ))}

                <div className="text-center mt-3 pt-2 border-top border-secondary">
                  <h5 className="text-warning mb-0">
                    {averageRating.toFixed(1)}/5
                  </h5>
                  <small className="text-light">
                    {totalRatings} {totalRatings === 1 ? "review" : "reviews"}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      

      {/* Trailer Modal */}
      <Modal
        show={showTrailerModal}
        onHide={() => setShowTrailerModal(false)}
        size="xl"
        centered
      >
        <Modal.Header className="bg-dark border-0">
          <Modal.Title className="text-white d-flex align-items-center">
            <FaPlay className="me-2" />
            {movie.title} - Official Trailer
          </Modal.Title>
          <Button
            variant="link"
            className="text-white p-0"
            onClick={() => setShowTrailerModal(false)}
          >
            <FaTimes size={24} />
          </Button>
        </Modal.Header>
        <Modal.Body className="bg-dark p-0">
          <div className="ratio ratio-16x9">
            {showTrailerModal && (movie.youtubeUrl || movie.trailer) && (
              <iframe
                src={getYouTubeEmbedUrl(movie.youtubeUrl || movie.trailer)}
                title={`${movie.title} Trailer`}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded"
              />
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MovieDetails;
