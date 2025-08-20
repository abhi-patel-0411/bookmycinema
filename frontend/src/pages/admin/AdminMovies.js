import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  InputGroup,
} from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaStar,
  FaCalendarAlt,
  FaClock,
  FaFilm,
  FaTimes,
  FaImage,
  FaUpload,
  FaPlay,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { moviesAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import ModernLoader from "../../components/common/ModernLoader";
import { useSocket } from "../../contexts/SocketContext";

import moment from "moment";

const getMoviePosterUrl = (posterPath, movieTitle = null) => {
  if (posterPath) {
    if (posterPath.startsWith('data:image/') || posterPath.startsWith('http')) return posterPath;
    return posterPath.startsWith('/') ? posterPath : `/${posterPath}`;
  }
  const initial = movieTitle ? movieTitle.charAt(0) : 'M';
  return `https://via.placeholder.com/300x450/1e293b/ffffff?text=${encodeURIComponent(initial)}`;
};



const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [showExpired, setShowExpired] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(10);
  const [movieRatings, setMovieRatings] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    duration: "",
    language: "",
    releaseDate: "",
    startDate: "",
    endDate: "",
    isUpcoming: false,
    isActive: true,
    price: "199",
    youtubeUrl: "",
    poster: null,
    posterUrl: "",
  });



  const [posterPreview, setPosterPreview] = useState("");

  const genres = [
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "Adventure",
    "Animation",
    "Fantasy",
  ];

  const languages = [
    "English",
    "Hindi",
    "Tamil",
    "Telugu",
    "Malayalam",
    "Kannada",
    "Bengali",
    "Marathi",
    "Gujarati",
    "Punjabi",
  ];

  const { connected } = useSocket();

  // Define fetchMovies before using it in useEffect
  const fetchMovies = React.useCallback(async () => {
    try {
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const response = await moviesAPI.getAll(
        `${showExpired}&_t=${timestamp}`,
        true
      ); // Pass isAdmin=true

      // Ensure we have an array of movies
      let moviesData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          moviesData = response.data;
        } else if (
          response.data.movies &&
          Array.isArray(response.data.movies)
        ) {
          moviesData = response.data.movies;
        } else if (typeof response.data === "object") {
          // If it's an object but not an array, try to extract movies
          moviesData = Object.values(response.data).filter(
            (item) => item && typeof item === "object" && item.title
          );
        }
      }

      console.log("Fetched movies:", moviesData.length);
      setMovies(moviesData);

      // Fetch ratings for each movie
      const ratingsPromises = moviesData.map(async (movie) => {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const ratingResponse = await fetch(
            `${API_URL}/ratings/movie/${movie._id}`
          );
          if (ratingResponse.ok) {
            const ratingData = await ratingResponse.json();
            return {
              movieId: movie._id,
              averageRating: parseFloat(ratingData.averageRating) || 0,
              totalRatings: ratingData.totalRatings || 0,
            };
          }
        } catch (error) {
          console.error(`Error fetching rating for movie ${movie._id}:`, error);
        }
        return {
          movieId: movie._id,
          averageRating: 0,
          totalRatings: 0,
        };
      });

      const ratingsResults = await Promise.all(ratingsPromises);
      const ratingsMap = {};
      ratingsResults.forEach((rating) => {
        ratingsMap[rating.movieId] = rating;
      });
      setMovieRatings(ratingsMap);
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.error("Failed to fetch movies");
    } finally {
      setLoading(false);
    }
  }, [showExpired]);

  useEffect(() => {
    fetchMovies();

    const handleMoviesUpdate = () => {
      fetchMovies();
    };

    window.addEventListener("movies-updated", handleMoviesUpdate);

    return () => {
      window.removeEventListener("movies-updated", handleMoviesUpdate);
    };
  }, [fetchMovies]);

  useEffect(() => {
    if (connected) {
      fetchMovies();
    }
  }, [connected, showExpired, fetchMovies]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Make dates optional but validate if provided
      if (
        (formData.startDate && !formData.endDate) ||
        (!formData.startDate && formData.endDate)
      ) {
        toast.error("Both start date and end date must be provided together");
        return;
      }

      // If both dates are provided, validate them
      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const minEndDate = new Date(startDate);
        minEndDate.setDate(minEndDate.getDate() + 7);

        if (endDate < minEndDate) {
          toast.error("End date must be at least 7 days after start date");
          return;
        }
      }

      const movieFormData = new FormData();

      // Handle isUpcoming flag first
      movieFormData.append(
        "isUpcoming",
        formData.isUpcoming ? "true" : "false"
      );
      console.log("isUpcoming value:", formData.isUpcoming);

      // Explicitly handle isActive field
      if (formData.isActive !== undefined) {
        movieFormData.append("isActive", formData.isActive ? "true" : "false");
        console.log("Setting isActive in form submission:", formData.isActive);
      }

      Object.keys(formData).forEach((key) => {
        if (key === "poster") {
          if (formData.poster instanceof File) {
            movieFormData.append("poster", formData.poster);
          }
        } else if (key === "posterUrl") {
          // Only use posterUrl if no file is uploaded
          if (formData.posterUrl && !formData.poster) {
            movieFormData.append("poster", formData.posterUrl);
          }
        } else if (
          key === "genre" &&
          formData[key] &&
          formData[key].includes(",")
        ) {
          const genres = formData[key].split(",").map((g) => g.trim());
          movieFormData.append("genre", genres);

        } else if (key === "startDate" || key === "endDate") {
          // Only add dates if they're provided
          if (formData[key]) {
            movieFormData.append(key, formData[key]);
          }
        } else if (key !== "isUpcoming" && key !== "isActive" && key !== "posterUrl") {
          // Skip isUpcoming, isActive, and posterUrl as we already handled them
          movieFormData.append(key, formData[key]);
        }
      });

      if (editingMovie) {
        await moviesAPI.update(editingMovie._id, movieFormData);
        toast.success("Movie updated successfully!");
      } else {
        await moviesAPI.create(movieFormData);
        toast.success("Movie created successfully!");
      }

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent("movies-updated"));

      // Close modal first to improve perceived performance
      handleCloseModal();

      // Add a small delay before fetching to ensure the backend has processed the changes
      setTimeout(() => {
        fetchMovies();
      }, 500);
    } catch (error) {
      console.error("Error saving movie:", error);
      toast.error(
        "Failed to save movie: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDelete = async (id, movieTitle) => {
    const confirmMessage = `Are you sure you want to permanently delete "${movieTitle}"?\n\nThis will:\n• Remove the movie completely from the database\n• Delete all related shows\n• Cancel all bookings for this movie\n\nThis action cannot be undone!`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await moviesAPI.delete(id);
        toast.success(`"${movieTitle}" has been permanently deleted!`);
        fetchMovies();
      } catch (error) {
        console.error("Error deleting movie:", error);
        toast.error("Failed to delete movie: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleSoftDelete = async (id, movieTitle) => {
    const confirmMessage = `Are you sure you want to deactivate "${movieTitle}"?\n\nThis will:\n• Mark the movie as inactive\n• Delete all related shows\n• Hide the movie from users\n\nYou can reactivate it later if needed.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await moviesAPI.softDelete(id);
        toast.success(`"${movieTitle}" has been deactivated!`);
        fetchMovies();
      } catch (error) {
        console.error("Error deactivating movie:", error);
        toast.error("Failed to deactivate movie: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEdit = (movie) => {
    console.log("Editing movie:", movie);
    console.log("isUpcoming value:", movie.isUpcoming);

    setEditingMovie(movie);
    setFormData({
      title: movie.title || "",
      description: movie.description || "",
      genre: Array.isArray(movie.genre)
        ? movie.genre.join(", ")
        : movie.genre || "",
      duration: movie.duration || "",
      language: movie.language || "",
      releaseDate: movie.releaseDate
        ? moment(movie.releaseDate).format("YYYY-MM-DD")
        : "",
      startDate: movie.startDate
        ? moment(movie.startDate).format("YYYY-MM-DD")
        : "",
      endDate: movie.endDate ? moment(movie.endDate).format("YYYY-MM-DD") : "",
      isUpcoming: movie.isUpcoming === true || movie.isUpcoming === "true",
      isActive: movie.isActive !== false,
      price: movie.price || "",
      youtubeUrl: movie.youtubeUrl || "",
      poster: null,
      posterUrl: movie.poster && movie.poster.startsWith('http') ? movie.poster : "",
    });

    if (movie.poster) {
      setPosterPreview(getMoviePosterUrl(movie.poster, movie.title));
    } else {
      setPosterPreview("");
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMovie(null);
    setFormData({
      title: "",
      description: "",
      genre: "",
      duration: "",
      language: "",
      releaseDate: "",
      startDate: "",
      endDate: "",
      isUpcoming: false,
      isActive: true,
      price: "199",
      youtubeUrl: "",
      poster: null,
      posterUrl: "",
    });
    setPosterPreview("");
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, poster: file, posterUrl: '' });
      const previewUrl = URL.createObjectURL(file);
      setPosterPreview(previewUrl);
    }
  };



  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre =
      !filterGenre ||
      (Array.isArray(movie.genre)
        ? movie.genre.includes(filterGenre)
        : movie.genre === filterGenre);
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "active" && movie.isActive !== false) ||
      (filterStatus === "inactive" && movie.isActive === false);
    const matchesLanguage =
      !filterLanguage || movie.language === filterLanguage;
    const matchesDate =
      !filterDate ||
      (movie.releaseDate &&
        new Date(movie.releaseDate).toISOString().split("T")[0] === filterDate);
    return matchesSearch && matchesGenre && matchesStatus && matchesLanguage && matchesDate;
  });

  // Pagination logic
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = filteredMovies.slice(
    indexOfFirstMovie,
    indexOfLastMovie
  );
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <ModernLoader text="Loading Movies" />;

  return (
    <AdminLayout>
      <div style={{ background: "#1f2025", minHeight: "100vh", color: "#fff" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          {/* Header - Mobile Optimized */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
            <div className="mb-3 mb-md-0">
              <h1 className="text-white mb-2">Movies Management</h1>
              <p className="text-light mb-0">Manage your movie catalog</p>
            </div>
            <div>
              <Button
                variant="primary"
                className="px-4 py-2 w-100"
                onClick={() => setShowModal(true)}
                style={{
                  background: "linear-gradient(135deg, #e63946, #f84565)",
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 4px 15px rgba(232, 57, 70, 0.3)",
                }}
              >
                <FaPlus className="me-2" />
                Add New Movie
              </Button>
            </div>
          </div>

          {/* Search and Filter - Mobile Optimized */}
          <Row className="mb-4">
            <Col xs={12} lg={4} className="mb-3">
              <style>
                {`.search-input::placeholder { color: #ffffff !important; }`}
              </style>
              <div className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden" style={{ height: '46px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 30 30" fill="#6B7280">
                  <path d="M13 3C7.489 3 3 7.489 3 13s4.489 10 10 10a9.95 9.95 0 0 0 6.322-2.264l5.971 5.971a1 1 0 1 0 1.414-1.414l-5.97-5.97A9.95 9.95 0 0 0 23 13c0-5.511-4.489-10-10-10m0 2c4.43 0 8 3.57 8 8s-3.57 8-8 8-8-3.57-8-8 3.57-8 8-8"/>
                </svg>
                <Form.Control
                  type="text"
                  placeholder="Search movies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 bg-transparent w-100 h-100 ms-2 search-input"
                  style={{
                    outline: 'none',
                    boxShadow: 'none',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '400'
                  }}
                  onFocus={(e) => e.target.style.setProperty('--bs-form-control-placeholder-color', '#ffffff', 'important')}
                  onBlur={(e) => e.target.style.setProperty('--bs-form-control-placeholder-color', '#ffffff', 'important')}
                />
              </div>
            </Col>
            <Col xs={12} lg={8}>
              <Row className="g-2">
                <Col xs={6} md={3}>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-dark border-secondary text-white rounded-pill"
                    style={{ height: '46px' }}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active Movies</option>
                    <option value="inactive">Inactive Movies</option>
                  </Form.Select>
                </Col>
                <Col xs={6} md={3}>
                  <Form.Select
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    className="bg-dark border-secondary text-white rounded-pill"
                    style={{ height: '46px' }}
                  >
                    <option value="">All Genres</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={6} md={3}>
                  <Form.Select
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    className="bg-dark border-secondary text-white rounded-pill"
                    style={{ height: '46px' }}
                  >
                    <option value="">All Languages</option>
                    {languages.map((language) => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={6} md={3}>
                  <Form.Control
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-dark border-secondary text-white rounded-pill"
                    style={{ height: '46px' }}
                    placeholder="Filter by date"
                  />
                </Col>
              </Row>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col xs={12}>
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div className="d-flex align-items-center text-white mb-2">
                  <FaFilter className="me-2" />
                  <span>{filteredMovies.length} movies found</span>
                </div>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="switch"
                    id="show-expired-switch"
                    label="Show expired movies"
                    checked={showExpired}
                    onChange={(e) => {
                      setShowExpired(e.target.checked);
                      fetchMovies();
                    }}
                    className="text-white"
                  />
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterGenre('');
                      setFilterStatus('');
                      setFilterLanguage('');
                      setFilterDate('');
                    }}
                    className="rounded-pill"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </motion.div>

        {/* Movies Table - Mobile Optimized */}
        {filteredMovies.length > 0 ? (
          <>
            <div
              className="card border-0"
              style={{
                borderRadius: "15px",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div className="table-responsive" style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>
                  {`.table-responsive::-webkit-scrollbar { display: none; }`}
                </style>
                <Table hover variant="dark" className="mb-0 table-responsive">
                  <thead
                    style={{
                      background: "linear-gradient(135deg, #e63946, #f84565)",
                    }}
                  >
                    <tr>
                      <th
                        className="text-center"
                        style={{ width: "80px" }}
                      >
                        #
                      </th>
                      <th style={{ width: "100px" }}>Poster</th>
                      <th>Title</th>
                      <th>Genre</th>
                      <th>Duration</th>
                      <th>Language</th>
                      <th>Showing Period</th>
                      <th>Release Date</th>
                      <th className="text-center" style={{ width: "100px" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMovies.map((movie, index) => (
                      <motion.tr
                        key={movie._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          background: !movie.isActive
                            ? "rgba(220, 53, 69, 0.1)"
                            : index % 2 === 0
                            ? "rgba(42, 45, 53, 0.3)"
                            : "transparent",
                        }}
                      >
                        <td className="text-center fw-bold">
                          {indexOfFirstMovie + index + 1}
                        </td>
                        <td>
                          <img
                            src={getMoviePosterUrl(movie.poster, movie.title)}
                            alt={movie.title}
                            className="img-fluid"
                            style={{
                              width: "60px",
                              height: "90px",
                              objectFit: "cover",
                              borderRadius: "10px",
                              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                            }}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="fw-bold text-white">
                              {movie.title}
                            </div>
                            {!movie.isActive && (
                              <Badge
                                bg="danger"
                                pill
                                style={{ fontSize: "0.65rem" }}
                              >
                                Expired
                              </Badge>
                            )}
                          </div>
                          <small className="text-white d-block d-md-none">
                            {Array.isArray(movie.genre)
                              ? movie.genre.join(", ")
                              : movie.genre || "Drama"}{" "}
                            • {movie.duration || "120"} min
                          </small>
                          <small className="text-white d-none d-md-block">
                            {movie.description
                              ? movie.description.length > 50
                                ? movie.description.substring(0, 50) + "..."
                                : movie.description
                              : "No description"}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {(Array.isArray(movie.genre)
                              ? movie.genre
                              : [movie.genre || "Drama"]
                            ).map((g, i) => (
                              <Badge
                                key={i}
                                bg="secondary"
                                className="small me-1 mb-1"
                                style={{
                                  borderRadius: "20px",
                                  padding: "5px 10px",
                                }}
                              >
                                {g}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaClock className="me-1 text-white" size={12} />
                            <span className="text-white">{movie.duration || "120"} min</span>
                          </div>
                        </td>
                        <td>
                          <Badge
                            bg="info"
                            className="small"
                            style={{
                              borderRadius: "20px",
                              padding: "5px 10px",
                            }}
                          >
                            {movie.language || "English"}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            {movie.startDate && movie.endDate ? (
                              <>
                                <div className="d-flex align-items-center mb-1">
                                  <span
                                    className="badge bg-success me-2"
                                    style={{ fontSize: "0.65rem" }}
                                  >
                                    Start
                                  </span>
                                  <span>
                                    {moment(movie.startDate).format(
                                      "MMM DD, YYYY"
                                    )}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center">
                                  <span
                                    className="badge bg-danger me-2"
                                    style={{ fontSize: "0.65rem" }}
                                  >
                                    End
                                  </span>
                                  <span>
                                    {moment(movie.endDate).format(
                                      "MMM DD, YYYY"
                                    )}
                                  </span>
                                </div>
                                {/* Show days remaining or expired status */}
                                {(() => {
                                  const now = moment();
                                  const start = moment(movie.startDate);
                                  const end = moment(movie.endDate);

                                  if (now.isBefore(start)) {
                                    const daysToStart = start.diff(now, "days");
                                    return (
                                      <div className="mt-1">
                                        <Badge
                                          bg="info"
                                          style={{
                                            fontSize: "0.7rem",
                                            borderRadius: "10px",
                                          }}
                                        >
                                          Starts in {daysToStart} day
                                          {daysToStart !== 1 ? "s" : ""}
                                        </Badge>
                                      </div>
                                    );
                                  } else if (now.isAfter(end)) {
                                    return (
                                      <div className="mt-1">
                                        <Badge
                                          bg="secondary"
                                          style={{
                                            fontSize: "0.7rem",
                                            borderRadius: "10px",
                                          }}
                                        >
                                          Expired
                                        </Badge>
                                      </div>
                                    );
                                  } else {
                                    const daysLeft = end.diff(now, "days");
                                    return (
                                      <div className="mt-1">
                                        <Badge
                                          bg="warning"
                                          style={{
                                            fontSize: "0.7rem",
                                            borderRadius: "10px",
                                          }}
                                        >
                                          {daysLeft} day
                                          {daysLeft !== 1 ? "s" : ""} left
                                        </Badge>
                                      </div>
                                    );
                                  }
                                })()}
                              </>
                            ) : (
                              <div>
                                <span className="text-white d-block mb-1">
                                  Not scheduled
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  style={{
                                    fontSize: "0.7rem",
                                    borderRadius: "10px",
                                  }}
                                  onClick={() => handleEdit(movie)}
                                >
                                  Schedule Now
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <div className="d-flex align-items-center mb-1">
                              <FaCalendarAlt
                                className="me-1 text-white"
                                size={12}
                              />
                              <span className="text-white">
                                {movie.releaseDate
                                  ? moment(movie.releaseDate).format(
                                      "MMM DD, YYYY"
                                    )
                                  : "Not set"}
                              </span>
                            </div>
                            {movie.isUpcoming && (
                              <Badge
                                bg="warning"
                                className="small"
                                style={{
                                  borderRadius: "20px",
                                  padding: "3px 8px",
                                  width: "fit-content",
                                }}
                              >
                                Upcoming
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEdit(movie)}
                              title="Edit Movie"
                              style={{ borderRadius: "8px" }}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(movie._id, movie.title)}
                              title="Permanently Delete Movie"
                              style={{ borderRadius: "8px" }}
                            >
                              <FaTrash />
                            </Button>
                            {movie.isActive ? (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleSoftDelete(movie._id, movie.title)}
                                title="Deactivate Movie"
                                style={{ borderRadius: "8px" }}
                              >
                                <FaTimes />
                              </Button>
                            ) : (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to reactivate "${movie.title}"? It will be scheduled from today for the next 7 days.`
                                    )
                                  ) {
                                    const movieData = new FormData();
                                    movieData.append("isActive", "true");
                                    
                                    // Set start date to current date
                                    const startDate = moment().format("YYYY-MM-DD");
                                    // Set end date to 7 days from current date
                                    const endDate = moment().add(7, "days").format("YYYY-MM-DD");
                                    
                                    movieData.append("startDate", startDate);
                                    movieData.append("endDate", endDate);
                                    
                                    console.log(
                                      "Reactivating movie with ID:",
                                      movie._id,
                                      "Start:", startDate,
                                      "End:", endDate
                                    );
                                    moviesAPI
                                      .update(movie._id, movieData)
                                      .then(() => {
                                        toast.success(
                                          `"${movie.title}" has been reactivated and scheduled from ${moment().format('MMM DD')} to ${moment().add(7, 'days').format('MMM DD, YYYY')}`
                                        );
                                        fetchMovies();
                                      })
                                      .catch((error) => {
                                        console.error(
                                          "Error reactivating movie:",
                                          error
                                        );
                                        toast.error(
                                          "Failed to reactivate movie"
                                        );
                                      });
                                  }
                                }}
                                title="Reactivate Movie (7-day schedule)"
                                style={{ borderRadius: "8px" }}
                              >
                                <FaPlay size={10} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* Professional Mobile Pagination */}
            {totalPages > 1 && (
              <div className="mt-3 p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-light">{indexOfFirstMovie + 1}-{Math.min(indexOfLastMovie, filteredMovies.length)} of {filteredMovies.length}</small>
                  <small className="text-primary">{currentPage}/{totalPages}</small>
                </div>
                <div className="d-flex justify-content-center gap-1">
                  <button className="btn btn-outline-light btn-sm" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)} style={{ width: '32px', height: '32px', padding: '0', fontSize: '14px' }}>‹</button>
                  {(() => {
                    const c = currentPage, t = totalPages;
                    if (t <= 5) return Array.from({length: t}, (_, i) => i + 1);
                    if (c <= 3) return [1, 2, 3, '...', t];
                    if (c >= t - 2) return [1, '...', t - 2, t - 1, t];
                    return [1, '...', c - 1, c, c + 1, '...', t];
                  })().map((p, i) => 
                    p === '...' ? <span key={i} className="px-1 text-secondary">...</span> :
                    <button key={p} className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-outline-light'}`} onClick={() => paginate(p)} style={{ width: '32px', height: '32px', padding: '0', fontSize: '12px' }}>{p}</button>
                  )}
                  <button className="btn btn-outline-light btn-sm" disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)} style={{ width: '32px', height: '32px', padding: '0', fontSize: '14px' }}>›</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-5"
          >
            <FaFilm size={60} className="text-muted mb-3" />
            <h4 className="text-white mb-2">No Movies Found</h4>
            <p className="text-white mb-3">
              {searchTerm || filterGenre
                ? "Try adjusting your search criteria"
                : "Start by adding your first movie"}
            </p>
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              style={{
                background: "linear-gradient(135deg, #e63946, #f84565)",
                borderRadius: "10px",
                border: "none",
                boxShadow: "0 4px 15px rgba(232, 57, 70, 0.3)",
              }}
            >
              <FaPlus className="me-2" />
              Add Your First Movie
            </Button>
          </motion.div>
        )}

        {/* Add/Edit Movie Modal */}
        <Modal
          show={showModal}
          onHide={handleCloseModal}
          size="lg"
          centered
          contentClassName="border-0"
          dialogClassName="modal-90w"
        >
          <Modal.Header
            closeButton
            className="border-0"
            style={{
              background: "linear-gradient(135deg, #1f2025, #2a2d35)",
              borderRadius: "15px 15px 0 0",
              padding: "20px 30px",
              boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Modal.Title className="text-white fw-bold d-flex align-items-center">
              <div
                className="bg-gradient rounded-circle p-2 me-3"
                style={{
                  background: "linear-gradient(135deg, #e63946, #f84565)",
                }}
              >
                <FaFilm className="text-white" size={20} />
              </div>
              <div>
                <h4 className="mb-0">
                  {editingMovie ? "Edit Movie Details" : "Add New Movie"}
                </h4>
                <small className="text-light">
                  {editingMovie
                    ? "Update movie information"
                    : "Create a new movie in your catalog"}
                </small>
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              background: "linear-gradient(135deg, #1f2025, #2a2d35)",
              padding: "30px",
            }}
          >
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">
                      Movie Title <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      style={{
                        backgroundColor: "#2a2d35",
                        borderColor: "#6c757d",
                        color: "#fff",
                        borderRadius: "10px",
                      }}
                      placeholder="Enter movie title"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Genre</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        value={formData.genre}
                        onChange={(e) =>
                          setFormData({ ...formData, genre: e.target.value })
                        }
                        placeholder="Action, Drama, Comedy"
                        style={{
                          backgroundColor: "#2a2d35",
                          borderColor: "#6c757d",
                          color: "#fff",
                          borderRadius: "10px",
                        }}
                      />
                      <small className="text-white d-block mt-1">
                        Separate multiple genres with commas
                      </small>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="text-white">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  style={{
                    backgroundColor: "#2a2d35",
                    borderColor: "#6c757d",
                    color: "#fff",
                    borderRadius: "10px",
                  }}
                  placeholder="Enter movie description..."
                />
              </Form.Group>

              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">
                      Duration (min)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      style={{
                        backgroundColor: "#2a2d35",
                        borderColor: "#6c757d",
                        color: "#fff",
                        borderRadius: "10px",
                      }}
                      placeholder="120"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Language</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                      style={{
                        backgroundColor: "#2a2d35",
                        borderColor: "#6c757d",
                        color: "#fff",
                        borderRadius: "10px",
                      }}
                      placeholder="English"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Release Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          releaseDate: e.target.value,
                        })
                      }
                      style={{
                        backgroundColor: "#2a2d35",
                        borderColor: "#6c757d",
                        color: "#fff",
                        borderRadius: "10px",
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        const currentDate = new Date().toISOString().split('T')[0];
                        const isUpcoming = startDate > currentDate;
                        
                        // Calculate end date (7 days after start date)
                        const endDate = startDate
                          ? moment(startDate)
                              .add(7, "days")
                              .format("YYYY-MM-DD")
                          : "";
                        setFormData({ ...formData, startDate, endDate, isUpcoming });
                      }}
                      style={{
                        backgroundColor: "#2a2d35",
                        borderColor: formData.startDate ? "#28a745" : "#6c757d",
                        color: "#fff",
                        borderRadius: "10px",
                        boxShadow: formData.startDate
                          ? "0 0 0 0.2rem rgba(40, 167, 69, 0.25)"
                          : "none",
                      }}
                    />
                    <small className="text-white d-flex align-items-center mt-1">
                      <FaCalendarAlt className="me-1" size={12} />
                      First day movie will be shown (optional)
                    </small>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      style={{
                        backgroundColor: "#2a2d35",
                        borderColor: formData.endDate ? "#28a745" : "#6c757d",
                        color: "#fff",
                        borderRadius: "10px",
                        boxShadow: formData.endDate
                          ? "0 0 0 0.2rem rgba(40, 167, 69, 0.25)"
                          : "none",
                      }}
                      min={
                        formData.startDate
                          ? moment(formData.startDate)
                              .add(7, "days")
                              .format("YYYY-MM-DD")
                          : ""
                      }
                      disabled={!formData.startDate}
                    />
                    <small className="text-white d-flex align-items-center mt-1">
                      <FaCalendarAlt className="me-1" size={12} />
                      Last day movie will be shown (min 7 days after start)
                    </small>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3 mt-2">
                    <Form.Check
                      type="switch"
                      id="upcoming-switch"
                      label="Mark as Upcoming Movie (Auto-detected)"
                      checked={formData.isUpcoming}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isUpcoming: e.target.checked,
                        })
                      }
                      className="mt-2"
                      disabled={!!formData.startDate}
                    />
                    <small className="text-white d-block mb-2">
                      {formData.startDate ? 
                        'Auto-detected based on showing period start date' : 
                        'Will appear in the Upcoming section'
                      }
                    </small>

                    {editingMovie && (
                      <>
                        <Form.Check
                          type="switch"
                          id="active-switch"
                          label="Movie Active Status"
                          checked={formData.isActive !== false}
                          onChange={(e) => {
                            if (
                              !e.target.checked &&
                              window.confirm(
                                "Deactivating this movie will delete all related shows. Continue?"
                              )
                            ) {
                              setFormData({
                                ...formData,
                                isActive: false,
                              });
                            } else if (e.target.checked) {
                              setFormData({
                                ...formData,
                                isActive: true,
                              });
                            }
                          }}
                          className="mt-3"
                        />
                        <small className="text-white d-block">
                          {formData.isActive !== false
                            ? "Movie is active and visible to users"
                            : "Movie is expired and hidden from users"}
                        </small>
                      </>
                    )}
                  </Form.Group>
                </Col>
              </Row>



              <Form.Group className="mb-4">
                <Form.Label className="text-white fw-bold mb-3">
                  Movie Poster
                </Form.Label>
                <div className="d-flex gap-4 align-items-center">
                  <div className="position-relative">
                    {posterPreview || editingMovie?.poster || formData.posterUrl ? (
                      <img
                        src={posterPreview || getMoviePosterUrl(editingMovie?.poster) || formData.posterUrl}
                        alt="Poster Preview"
                        className="rounded"
                        style={{
                          width: "120px",
                          height: "180px",
                          objectFit: "cover",
                          borderRadius: "10px",
                          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
                          transition: "all 0.3s ease",
                        }}
                      />
                    ) : (
                      <div
                        className="d-flex flex-column align-items-center justify-content-center bg-dark rounded"
                        style={{
                          width: "120px",
                          height: "180px",
                          borderRadius: "10px",
                          border: "2px dashed #6c757d",
                        }}
                      >
                        <FaImage size={30} className="text-secondary mb-2" />
                        <span className="text-secondary small text-center">
                          No poster
                          <br />
                          selected
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div
                      className="p-4 rounded"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: "10px",
                      }}
                    >
                      <div className="d-flex align-items-center mb-3">
                        <FaImage className="text-primary me-2" />
                        <span className="text-white">Image URL (Recommended)</span>
                      </div>
                      <Form.Control
                        type="url"
                        value={formData.posterUrl || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          setFormData({ ...formData, posterUrl: url, poster: null });
                          setPosterPreview(url);
                        }}
                        placeholder="https://example.com/movie-poster.jpg"
                        style={{
                          backgroundColor: "#2a2d35",
                          borderColor: "#6c757d",
                          color: "#fff",
                          borderRadius: "10px",
                          marginBottom: "15px",
                        }}
                      />
                      
                      <div className="text-center text-white mb-3">
                        <span>OR</span>
                      </div>
                      
                      <div className="d-flex align-items-center mb-3">
                        <FaUpload className="text-primary me-2" />
                        <span className="text-white">Upload Movie Poster</span>
                      </div>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handlePosterChange}
                        style={{
                          backgroundColor: "#2a2d35",
                          borderColor: "#6c757d",
                          color: "#fff",
                          borderRadius: "10px",
                          padding: "10px",
                        }}
                      />
                      <small className="text-white d-block mt-2">
                        <ul className="ps-3 mb-0">
                          <li><strong>Image URL is recommended</strong> for better performance</li>
                          <li>File upload: JPG, PNG, WebP (max 5MB) - works on all devices</li>
                          <li>Recommended size: 300x450 pixels</li>
                          <li>Uploaded images work across all devices and platforms</li>
                        </ul>
                      </small>
                    </div>
                  </div>
                </div>
              </Form.Group>

              {/* Trailer Video URL */}
              <Form.Group className="mb-4">
                <Form.Label className="text-white fw-bold mb-3">
                  Trailer Video URL
                </Form.Label>
                <Form.Control
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, youtubeUrl: e.target.value })
                  }
                  placeholder="Enter YouTube or video URL (e.g. https://youtube.com/watch?v=...)"
                  style={{
                    backgroundColor: "#1f2025",
                    borderColor: "#6c757d",
                    color: "#fff",
                    borderRadius: "10px",
                  }}
                />
                <small className="text-white d-block mt-1">
                  Paste a YouTube or direct video link for the movie trailer
                  (optional)
                </small>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer
            className="border-0"
            style={{
              background: "linear-gradient(135deg, #1f2025, #2a2d35)",
              borderRadius: "0 0 15px 15px",
              padding: "20px 30px",
              boxShadow: "0 -5px 15px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Button
              variant="outline-light"
              onClick={handleCloseModal}
              className="px-4 py-2"
              style={{
                borderRadius: "10px",
                borderWidth: "2px",
                fontWeight: "600",
                transition: "all 0.3s ease",
              }}
            >
              <FaTimes className="me-2" /> Cancel
            </Button>
            <Button
              variant="primary"
              className="px-4 py-2"
              onClick={handleSubmit}
              style={{
                background: "linear-gradient(135deg, #e63946, #f84565)",
                borderRadius: "10px",
                border: "none",
                boxShadow: "0 4px 15px rgba(232, 57, 70, 0.3)",
                fontWeight: "600",
                transition: "all 0.3s ease",
              }}
            >
              {editingMovie ? (
                <>
                  <FaEdit className="me-2" /> Update Movie
                </>
              ) : (
                <>
                  <FaPlus className="me-2" /> Add Movie
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminMovies;
