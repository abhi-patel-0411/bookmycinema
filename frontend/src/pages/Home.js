import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Form,
  InputGroup,
} from "react-bootstrap";
import { motion } from "framer-motion";
import {
  FaPlay,
  FaStar,
  FaClock,
  FaTicketAlt,
  FaSearch,
  FaArrowRight,
  FaFilm,
  FaUsers,
  FaMapMarkerAlt,
  FaFire,
  FaHeart,
  FaChevronLeft,
  FaChevronRight,
  FaTrophy,
  FaRocket,
  FaCalendarAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { moviesAPI, theatersAPI } from "../services/api";
import {
  filterMoviesByStatus,
  formatMovieForCarousel,
} from "../services/movieService";
import ModernLoader from "../components/common/ModernLoader";
import TrendingCarousel from "../components/common/TrendingCarousel";
import { useAuth } from "../contexts/AuthContext";

import "../styles/home-page.css";

// Hide Spline watermark and add custom button styles
const splineStyles = `
  .spline-watermark {
    display: none !important;
  }
  iframe .spline-watermark {
    display: none !important;
  }
  
  /* Explore Movies Button Styles - Spline Watermark Position */
  .explore-movies-btn {
    bottom: 20px;
    right: 16px;
    z-index: 1000;
    background-color: rgba(220, 53, 69, 0.9) !important;
    border: none !important;
    border-radius: 20px !important;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
    transition: all 0.3s ease;
    white-space: nowrap;
    position: relative;

    height: 36px;
    min-width: 120px;
    max-width: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  

  
  .explore-movies-btn:hover {
    background-color: rgba(220, 53, 69, 1) !important;
    
    box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
  }
  
  /* Animated Arrow */
  .arrow-animate {
    transition: transform 0.3s ease;
  }
  
  .explore-movies-btn:hover .arrow-animate {
    transform: translateX(5px);
    animation: arrowBounce 1s infinite;
  }
  
  @keyframes arrowBounce {
    0%, 100% { transform: translateX(5px); }
    50% { transform: translateX(8px); }
  }
  
  /* Consistent Spline Watermark Position - All Devices */
  @media (max-width: 768px) {
    .explore-movies-btn {
      bottom: 16px;
      right: 16px;
      padding: 8px 16px;
      font-size: 12px;
      height: 36px;
      min-width: 120px;
      max-width: 140px;
    }
  }
  
  @media (max-width: 480px) {
    .explore-movies-btn {
      bottom: 3px;
      right: 16px;
      padding: 8px 16px;
      font-size: 12px;
      height: 36px;
      min-width: 120px;
      max-width: 140px;
    }
  }
  
  @media (max-width: 360px) {
    .explore-movies-btn {
      bottom: 16px;
      right: 16px;
      padding: 8px 16px;
      font-size: 12px;
      height: 36px;
      min-width: 120px;
      max-width: 140px;
    }
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = splineStyles;
  document.head.appendChild(styleSheet);
}
const Home = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [currentMovies, setCurrentMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ movies: 0, theaters: 0, users: 1250 });

  const [trendingScrollPosition, setTrendingScrollPosition] = useState(0);
  const [popularScrollPosition, setPopularScrollPosition] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleAudio = async () => {
    if (audioRef.current) {
      try {
        if (isAudioPlaying) {
          audioRef.current.pause();
          setIsAudioPlaying(false);
        } else {
          audioRef.current.volume = 0.3;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsAudioPlaying(true);
          }
        }
      } catch (error) {
        console.log("Audio error:", error);
        setIsAudioPlaying(false);
      }
    }
  };

  useEffect(() => {
    fetchData();

    const handleScroll = () => {
      if (isAudioPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAudioPlaying]);

  const fetchData = async () => {
    try {
      const [moviesRes, theatersRes] = await Promise.all([
        moviesAPI.getAll(),
        theatersAPI.getAll(),
      ]);

      // Ensure we're getting the correct data structure
      let moviesData = [];
      if (moviesRes && moviesRes.data) {
        // Handle different API response formats
        if (Array.isArray(moviesRes.data)) {
          moviesData = moviesRes.data;
        } else if (
          moviesRes.data.movies &&
          Array.isArray(moviesRes.data.movies)
        ) {
          moviesData = moviesRes.data.movies;
        } else if (typeof moviesRes.data === "object") {
          // If it's an object but not an array, try to extract movies
          moviesData = Object.values(moviesRes.data).filter(
            (item) => item && typeof item === "object" && item.title
          );
        }
      }

      const theatersData = theatersRes.data.theaters || theatersRes.data || [];

      console.log("Raw movies data:", moviesData);
      console.log("Movies data length:", moviesData.length);

      // Check for upcoming movies
      const hasUpcoming = moviesData.some(
        (movie) => movie.isUpcoming === true || movie.isUpcoming === "true"
      );
      console.log("Has upcoming movies by flag:", hasUpcoming);

      // Check for movies with dates
      const hasStartDates = moviesData.some(
        (movie) => movie.startDate && movie.endDate
      );
      console.log("Has movies with start/end dates:", hasStartDates);

      // Filter movies by status
      const { upcoming, current, featured } = filterMoviesByStatus(moviesData);

      console.log("Upcoming movies count:", upcoming.length);
      console.log("Current movies count:", current.length);
      console.log("Featured movies count:", featured.length);

      setUpcomingMovies(upcoming);
      setCurrentMovies(current);
      setFeaturedMovies(featured);

      setStats({
        movies: moviesData.length,
        theaters: Array.isArray(theatersData) ? theatersData.length : 0,
        users: 1250,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      // Use default data if fetch fails
      setUpcomingMovies([]);
      setCurrentMovies([]);
      setFeaturedMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const scrollCarousel = (direction, type) => {
    let scrollAmount = 224;
    if (window.innerWidth <= 480) scrollAmount = 136;
    else if (window.innerWidth <= 576) scrollAmount = 156;
    else if (window.innerWidth <= 768) scrollAmount = 176;
    else if (window.innerWidth <= 1024) scrollAmount = 200;

    const container = document.querySelector(
      `.${type}-carousel .carousel-container`
    );
    if (container) {
      const currentPosition =
        type === "trending" ? trendingScrollPosition : popularScrollPosition;
      const newPosition =
        direction === "left"
          ? Math.max(0, currentPosition - scrollAmount)
          : currentPosition + scrollAmount;

      container.style.transform = `translateX(-${newPosition}px)`;

      if (type === "trending") {
        setTrendingScrollPosition(newPosition);
      } else {
        setPopularScrollPosition(newPosition);
      }
    }
  };

  if (loading) return <ModernLoader text="Loading Movies" />;

  return (
    <div
      className="text-white min-vh-100 home-page-container"
      style={{ backgroundColor: "#1f2025" }}
    >
      {/* Background Audio
      <audio ref={audioRef} loop preload="auto" id="audio">
        <source src="/audio/background.mp3" type="audio/mpeg" />
      </audio>

      
      <Button
        variant="dark"
        className="position-fixed rounded-circle d-flex align-items-center justify-content-center"
        style={{
          top: "20px",
          left: "20px",
          width: "50px",
          height: "50px",
          zIndex: 200000, // Increased to ensure above navbar
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          border: "none",
        }}
        onClick={toggleAudio}
      >
        {isAudioPlaying ? "🔊" : "🔇"}
      </Button> */}

      {/* Hero Section */}
      <section
        className="position-relative"
        style={{ height: "100vh", overflow: "hidden", maxWidth: "100vw" }}
      >
        {/* 3D Background */}
        <div
          className="position-absolute w-100 h-100"
          style={{ overflow: "hidden" }}
        >
          <iframe
            src="https://my.spline.design/themuseum-5zE6ddpT8N0iDKbWn1DyGAZD/"
            frameBorder="0"
            width="100%"
            height="100%"
            style={{ border: "none", maxWidth: "100%" }}
            title="3D Background"
          ></iframe>
        </div>

        {/* Explore Movies Button - Positioned like Spline watermark */}
        <Button
          variant="primary"
          className="position-absolute d-flex align-items-center explore-movies-btn"
          onClick={() => navigate("/movies")}
        >
          <FaFilm className="me-2" />
          <span>Explore Movies</span>
          <FaArrowRight className="ms-2 arrow-animate" />
        </Button>
      </section>

      {/* Movie Categories */}
      <section className="py-5" style={{ backgroundColor: "#1f2025" }}>
        <Container fluid className="px-md-4 px-3">
          {/* Now Showing Movies */}
          {currentMovies.length > 0 && (
            <div className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h3 text-white mb-0">
                  <FaFilm className="me-2 text-danger" />
                  Now Showing
                </h2>
              </div>

              <TrendingCarousel
                movies={currentMovies.map((movie) =>
                  formatMovieForCarousel(movie, "Now Showing", "success")
                )}
                title=""
              />
            </div>
          )}

          {/* Upcoming Movies */}
          {upcomingMovies.length > 0 && (
            <div className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h3 text-white mb-0">
                  <FaCalendarAlt className="me-2 text-warning" />
                  Coming Soon
                </h2>
              </div>

              <TrendingCarousel
                movies={upcomingMovies.map((movie) =>
                  formatMovieForCarousel(movie, "Coming Soon", "warning")
                )}
                title=""
              />
            </div>
          )}
        </Container>
      </section>
    </div>
  );
};

export default Home;
