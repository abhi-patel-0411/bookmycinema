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
const Home = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [currentMovies, setCurrentMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
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
        } else if (moviesRes.data.movies && Array.isArray(moviesRes.data.movies)) {
          moviesData = moviesRes.data.movies;
        } else if (typeof moviesRes.data === 'object') {
          // If it's an object but not an array, try to extract movies
          moviesData = Object.values(moviesRes.data).filter(item => 
            item && typeof item === 'object' && item.title
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
        {/* 3D Background with Loader */}
        <div
          className="position-absolute w-100 h-100"
          style={{ overflow: "hidden" }}
        >
          {iframeLoading && (
            <div className="position-absolute w-100 h-100" style={{ zIndex: 10 }}>
              <ModernLoader text="Loading 3D Experience" />
            </div>
          )}
          <iframe
            src="https://my.spline.design/themuseum-5zE6ddpT8N0iDKbWn1DyGAZD/"
            frameBorder="0"
            width="100%"
            height="100%"
            style={{ border: "none", maxWidth: "100%" }}
            title="3D Background"
            onLoad={() => setIframeLoading(false)}
          ></iframe>
        </div>

        {/* Explore Button - Position changes based on device size */}
        <div
          className="position-absolute"
          style={{
            bottom: window.innerWidth <= 768 ? "80px" : "18px",
            right: window.innerWidth <= 768 ? "50%" : "10px",
            transform: window.innerWidth <= 768 ? "translateX(50%)" : "none",
          }}
        >
          <Button
            variant="primary"
            size={window.innerWidth <= 768 ? "sm" : "lg"}
            className="px-1 py-1"
            onClick={() => navigate("/movies")}
            style={{
              background: "linear-gradient(135deg, #e63946, #f84565)",
              border: "none",
              boxShadow: "0 8px 20px rgba(232, 57, 70, 0.4)",
              fontWeight: "normal",
              borderRadius: "20px",
              minWidth: window.innerWidth <= 768 ? "150px" : "200px",
            }}
          >
            Explore Movies
            <FaArrowRight className="ms-2" />
          </Button>
        </div>
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
