import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  InputGroup,
  Button,
  Badge,
} from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaFilter,
  FaStar,
  FaCalendarAlt,
  FaTimes,
  FaClock,
  FaTicketAlt,
  FaEye,
  FaMapMarkerAlt,
  FaPlay,
} from "react-icons/fa";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import ModernLoader from "../components/common/ModernLoader";
import api from "../services/api";

import "../styles/movies-cards-simple.css";

const getMoviePosterUrl = (posterPath, movieTitle = null) => {
  if (posterPath) {
    if (posterPath.startsWith("data:image/") || posterPath.startsWith("http"))
      return posterPath;
    return posterPath.startsWith("/") ? posterPath : `/${posterPath}`;
  }
  const initial = movieTitle ? movieTitle.charAt(0) : "M";
  return `https://via.placeholder.com/300x450/1e293b/ffffff?text=${encodeURIComponent(
    initial
  )}`;
};

const Movies = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [sortBy, setSortBy] = useState({
    value: "title",
    label: "Title (A-Z)",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [movieRatings, setMovieRatings] = useState({});

  const [genreOptions, setGenreOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);

  const sortOptions = [
    { value: "title", label: "Title (A-Z)" },
    { value: "title_desc", label: "Title (Z-A)" },
    { value: "rating", label: "Rating (High to Low)" },
    { value: "rating_asc", label: "Rating (Low to High)" },
    { value: "releaseDate", label: "Release Date (Newest)" },
    { value: "releaseDate_asc", label: "Release Date (Oldest)" },
  ];

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    filterAndSortMovies();
  }, [movies, searchTerm, selectedGenre, selectedLanguage, sortBy]);

  const extractUniqueOptions = (movies) => {
    const genres = new Set();
    const languages = new Set();

    movies.forEach((movie) => {
      // Extract genres with case normalization
      if (movie.genre) {
        if (Array.isArray(movie.genre)) {
          movie.genre.forEach((g) => g && genres.add(g.trim()));
        } else if (typeof movie.genre === "string") {
          movie.genre
            .split(",")
            .forEach((g) => g.trim() && genres.add(g.trim()));
        }
      }

      // Extract languages with case normalization - avoid duplicates
      if (movie.language) {
        if (Array.isArray(movie.language)) {
          movie.language.forEach((l) => {
            if (l) {
              const normalized = l.trim();
              const lowerCase = normalized.toLowerCase();
              const exists = Array.from(languages).some(
                (existing) => existing.toLowerCase() === lowerCase
              );
              if (!exists) {
                languages.add(normalized);
              }
            }
          });
        } else if (typeof movie.language === "string") {
          movie.language.split(",").forEach((l) => {
            if (l.trim()) {
              const normalized = l.trim();
              const lowerCase = normalized.toLowerCase();
              const exists = Array.from(languages).some(
                (existing) => existing.toLowerCase() === lowerCase
              );
              if (!exists) {
                languages.add(normalized);
              }
            }
          });
        }
      }
    });

    const genreOpts = Array.from(genres)
      .sort()
      .map((genre) => ({ value: genre, label: genre }));
    const languageOpts = Array.from(languages)
      .sort()
      .map((lang) => ({ value: lang, label: lang }));

    setGenreOptions(genreOpts);
    setLanguageOptions(languageOpts);
  };

  const fetchMovies = async () => {
    try {
      // Explicitly request only active movies
      const response = await api.get("/movies?isAdmin=false");
      setMovies(response.data);

      // Extract unique genres and languages
      extractUniqueOptions(response.data);

      // Fetch ratings for each movie
      const ratingsPromises = response.data.map(async (movie) => {
        try {
          const apiUrl =
            process.env.REACT_APP_API_URL || "http://localhost:5000/api";
          const ratingResponse = await fetch(
            `${apiUrl}/ratings/movie/${movie._id}`
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
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMovies = () => {
    let filtered = [...movies];

    if (searchTerm) {
      filtered = filtered.filter((movie) => {
        const genreText = Array.isArray(movie.genre)
          ? movie.genre.join(" ").toLowerCase()
          : (movie.genre || "").toLowerCase();

        return (
          movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movie.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          genreText.includes(searchTerm.toLowerCase())
        );
      });
    }

    if (selectedGenre) {
      filtered = filtered.filter((movie) => {
        if (!movie.genre) return false;

        if (Array.isArray(movie.genre)) {
          return movie.genre.some(
            (g) =>
              g &&
              g.toLowerCase().trim() ===
                selectedGenre.value.toLowerCase().trim()
          );
        }

        if (typeof movie.genre === "string") {
          // Handle comma-separated genres with case insensitivity
          const genres = movie.genre
            .split(",")
            .map((g) => g.trim().toLowerCase());
          return genres.includes(selectedGenre.value.toLowerCase().trim());
        }

        return (
          movie.genre.toLowerCase().trim() ===
          selectedGenre.value.toLowerCase().trim()
        );
      });
    }

    if (selectedLanguage) {
      filtered = filtered.filter((movie) => {
        if (!movie.language) return false;

        if (Array.isArray(movie.language)) {
          return movie.language.some(
            (lang) =>
              lang &&
              lang.toLowerCase().trim() ===
                selectedLanguage.value.toLowerCase().trim()
          );
        }

        if (typeof movie.language === "string") {
          // Handle comma-separated languages with case insensitivity
          const languages = movie.language
            .split(",")
            .map((l) => l.trim().toLowerCase());
          return languages.includes(
            selectedLanguage.value.toLowerCase().trim()
          );
        }

        return (
          movie.language.toLowerCase().trim() ===
          selectedLanguage.value.toLowerCase().trim()
        );
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy.value) {
        case "title":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "rating":
          const aRating = movieRatings[a._id]?.averageRating || a.rating || 4.5;
          const bRating = movieRatings[b._id]?.averageRating || b.rating || 4.5;
          return bRating - aRating;
        case "rating_asc":
          const aRatingAsc =
            movieRatings[a._id]?.averageRating || a.rating || 4.5;
          const bRatingAsc =
            movieRatings[b._id]?.averageRating || b.rating || 4.5;
          return aRatingAsc - bRatingAsc;
        case "releaseDate":
          return new Date(b.releaseDate) - new Date(a.releaseDate);
        case "releaseDate_asc":
          return new Date(a.releaseDate) - new Date(b.releaseDate);
        default:
          return 0;
      }
    });

    setFilteredMovies(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGenre(null);
    setSelectedLanguage(null);
    setSortBy({ value: "title", label: "Title (A-Z)" });
  };

  const hasActiveFilters =
    searchTerm || selectedGenre || selectedLanguage || sortBy.value !== "title";

  if (loading) {
    return <ModernLoader text="Loading Movies" />;
  }

  return (
    <div
      className="text-white min-vh-100"
      style={{ backgroundColor: "#1f2025", paddingTop: "100px" }}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-5"
          data-aos="fade-down"
          data-aos-duration="600"
        >
          <h1
            className="display-4 fw-bold text-white mb-3"
            data-aos="zoom-in"
            data-aos-delay="150"
          >
            All Movies
          </h1>
          <p
            className="lead text-light"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            Discover and book tickets for the latest blockbuster movies
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4"
          data-aos="fade-up"
          data-aos-duration="600"
          data-aos-delay="400"
        >
          {/* Professional Filter Layout */}
          <div
            className="rounded-4 shadow-lg border p-4 mb-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(42, 45, 58, 0.95) 0%, rgba(33, 37, 41, 0.9) 100%)",
              backdropFilter: "blur(20px)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Row className="g-3 align-items-end">
              {/* Search */}
              <Col lg={4} md={6}>
                <label className="text-white fw-semibold mb-2 d-block">
                  Search Movies
                </label>
                <div
                  className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden"
                  style={{ height: "46px" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 30 30"
                    fill="#6B7280"
                  >
                    <path d="M13 3C7.489 3 3 7.489 3 13s4.489 10 10 10a9.95 9.95 0 0 0 6.322-2.264l5.971 5.971a1 1 0 1 0 1.414-1.414l-5.97-5.97A9.95 9.95 0 0 0 23 13c0-5.511-4.489-10-10-10m0 2c4.43 0 8 3.57 8 8s-3.57 8-8 8-8-3.57-8-8 3.57-8 8-8"></path>
                  </svg>
                  <input
                    placeholder="Search by title, genre..."
                    type="text"
                    className="border-0 bg-transparent w-100 h-100 ms-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      outline: "none",
                      boxShadow: "none",
                      color: "#ffffff",
                      fontSize: "15px",
                    }}
                  />
                </div>
              </Col>

              {/* Genre Filter */}
              <Col lg={3} md={6}>
                <label className="text-white fw-semibold mb-2 d-block">
                  Genre
                </label>
                <Select
                  options={genreOptions}
                  value={selectedGenre}
                  onChange={setSelectedGenre}
                  placeholder="All Genres"
                  isClearable
                  isSearchable={false}
                  menuShouldBlockScroll={true}
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderColor: state.isFocused
                        ? "#0d6efd"
                        : "rgba(255, 255, 255, 0.2)",
                      borderRadius: "23px",
                      minHeight: "46px",
                      boxShadow: "none",
                      cursor: "pointer",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "white",
                      fontSize: "15px",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "15px",
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "rgba(31, 32, 37, 0.98)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      zIndex: 9999,
                      position: "absolute",
                      width: "100%",
                      marginTop: "4px",
                    }),
                    menuList: (base) => ({
                      ...base,
                      maxHeight: "none", // Remove height restriction
                      overflowY: "visible", // Remove scroll
                      overflowX: "hidden",
                      padding: "8px",
                    }),
                    option: (base, state) => ({
                      ...base,
                      background: state.isFocused
                        ? "linear-gradient(135deg, #e63946, #f84565);"
                        : "transparent",
                      color: "white",
                      cursor: "pointer",
                    }),
                    clearIndicator: (base) => ({
                      ...base,
                      color: "rgba(255, 255, 255, 0.6)",
                    }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      color: "rgba(255, 255, 255, 0.6)",
                    }),
                  }}
                />
              </Col>

              {/* Language Filter */}
              <Col lg={3} md={6}>
                <label className="text-white fw-semibold mb-2 d-block">
                  Language
                </label>
                <Select
                  options={languageOptions}
                  value={selectedLanguage}
                  onChange={setSelectedLanguage}
                  placeholder="All Languages"
                  isClearable
                  isSearchable={false}
                  maxMenuHeight={120}
                  menuShouldBlockScroll={true}
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderColor: state.isFocused
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(255, 255, 255, 0.2)",
                      borderRadius: "23px",
                      minHeight: "46px",
                      boxShadow: "none",
                      cursor: "pointer",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "white",
                      fontSize: "15px",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "15px",
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "rgba(31, 32, 37, 0.98)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      zIndex: 9999,
                    }),
                    menuList: (base) => ({
                      ...base,
                      maxHeight: "200px",
                      overflowY: "auto",
                      overflowX: "hidden",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base, state) => ({
                      ...base,
                      background: state.isFocused
                        ? "linear-gradient(135deg, #e63946, #f84565)"
                        : "transparent",
                      color: "white",
                      cursor: "pointer",
                    }),
                    clearIndicator: (base) => ({
                      ...base,
                      color: "rgba(255, 255, 255, 0.6)",
                    }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      color: "rgba(255, 255, 255, 0.6)",
                    }),
                  }}
                />
              </Col>

              {/* Clear Filters */}
              <Col lg={2} md={6}>
                <Button
                  variant="outline-light"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  style={{
                    height: "46px",
                    borderRadius: "23px",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <FaTimes className="me-2" size={14} />
                  Clear All
                </Button>
              </Col>
            </Row>

            {/* Active Filters Display */}
            {(selectedGenre || selectedLanguage) && (
              <div
                className="d-flex flex-wrap gap-2 mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                <span
                  className="text-light me-2"
                  style={{ fontSize: "14px", opacity: 0.8 }}
                >
                  Active filters:
                </span>
                {selectedGenre && (
                  <Badge
                    className="px-3 py-2 rounded-pill d-flex align-items-center"
                    style={{
                      background:
                        "background: linear-gradient(135deg, #e63946, #f84565);",
                      fontSize: "13px",
                    }}
                  >
                    {selectedGenre.label}
                    <FaTimes
                      className="ms-2 cursor-pointer"
                      size={10}
                      onClick={() => setSelectedGenre(null)}
                      style={{ cursor: "pointer" }}
                    />
                  </Badge>
                )}
                {selectedLanguage && (
                  <Badge
                    className="px-3 py-2 rounded-pill d-flex align-items-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                      fontSize: "13px",
                    }}
                  >
                    {selectedLanguage.label}
                    <FaTimes
                      className="ms-2 cursor-pointer"
                      size={10}
                      onClick={() => setSelectedLanguage(null)}
                      style={{ cursor: "pointer" }}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <p className="text-light">
            Showing {filteredMovies.length} of {movies.length} movies
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {filteredMovies.length > 0 ? (
            <motion.div
              key="movies-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              <div className="movies-page-cards">
                <Row className="g-3">
                  {filteredMovies.map((movie, index) => (
                    <Col
                      key={movie._id}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={3}
                      xl={3}
                      xxl={2}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.3 }}
                        data-aos="fade-up"
                        data-aos-delay={Math.min(index * 30, 300)}
                        data-aos-duration="500"
                      >
                        <div
                          className="movie-card-simple"
                          onClick={() => navigate(`/movie/${movie._id}`)}
                        >
                          <div className="movie-poster-simple">
                            <img
                              src={getMoviePosterUrl(movie.poster, movie.title)}
                              alt={movie.title}
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = `https://via.placeholder.com/200x300/333/fff?text=${encodeURIComponent(
                                  movie.title
                                )}`;
                              }}
                            />

                            <div className="movie-rating-simple">
                              <FaStar className="star" />
                              <span>
                                {movieRatings[movie._id]?.averageRating > 0
                                  ? movieRatings[
                                      movie._id
                                    ].averageRating.toFixed(1)
                                  : movie.rating
                                  ? parseFloat(movie.rating).toFixed(1)
                                  : "4.5"}
                              </span>
                            </div>
                          </div>

                          <div className="movie-body-simple">
                            <h6 className="movie-title-simple">
                              {movie.title}
                            </h6>

                            <div className="movie-genres-container">
                              {Array.isArray(movie.genre) ? (
                                movie.genre.slice(0, 3).map((genre, idx) => (
                                  <span
                                    key={idx}
                                    className="movie-genre-simple"
                                  >
                                    {genre}
                                  </span>
                                ))
                              ) : movie.genre ? (
                                movie.genre
                                  .split(",")
                                  .slice(0, 3)
                                  .map((genre, idx) => (
                                    <span
                                      key={idx}
                                      className="movie-genre-simple"
                                    >
                                      {genre.trim()}
                                    </span>
                                  ))
                              ) : (
                                <span className="movie-genre-simple">
                                  Action
                                </span>
                              )}
                            </div>

                            <Button
                              className="movie-book-simple"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/movie/${movie._id}/showtimes`);
                              }}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-5"
            >
              <div className="mb-4">
                <FaSearch size={48} className="text-secondary" />
              </div>
              <h3 className="text-white mb-3">No Movies Found</h3>
              <p className="text-light mb-4">
                Try adjusting your search criteria or filters to discover more
                amazing movies.
              </p>
              <Button variant="primary" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default Movies;
