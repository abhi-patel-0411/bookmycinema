import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { FaFilm, FaCalendarAlt } from "react-icons/fa";
import { moviesAPI, theatersAPI } from "../services/api";
import { filterMoviesByStatus, formatMovieForCarousel } from "../services/movieService";
import ModernLoader from "../components/common/ModernLoader";
import TrendingCarousel from "../components/common/TrendingCarousel";

import "../styles/home-page.css";

const Home = () => {
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [currentMovies, setCurrentMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [moviesRes] = await Promise.all([
        moviesAPI.getAll(),
        theatersAPI.getAll(),
      ]);

      let moviesData = [];
      if (moviesRes && moviesRes.data) {
        if (Array.isArray(moviesRes.data)) {
          moviesData = moviesRes.data;
        } else if (moviesRes.data.movies && Array.isArray(moviesRes.data.movies)) {
          moviesData = moviesRes.data.movies;
        } else if (typeof moviesRes.data === "object") {
          moviesData = Object.values(moviesRes.data).filter(
            (item) => item && typeof item === "object" && item.title
          );
        }
      }

      const { upcoming, current } = filterMoviesByStatus(moviesData);

      setUpcomingMovies(upcoming);
      setCurrentMovies(current);
    } catch (error) {
      console.error("Error fetching data:", error);
      setUpcomingMovies([]);
      setCurrentMovies([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ModernLoader text="Loading Movies" />;

  return (
    <div
      className="text-white min-vh-100 home-page-container"
      style={{ backgroundColor: "#1f2025" }}
    >
      {/* Hero Section */}
      <section
        className="position-relative"
        style={{ height: "100vh", overflow: "hidden", maxWidth: "100vw" }}
      >
        <div className="position-absolute w-100 h-100" style={{ overflow: "hidden" }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
          >
            <source src="/video/spline.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* Movie Categories */}
      <section className="py-5" style={{ backgroundColor: "#1f2025" }}>
        <Container fluid className="px-md-4 px-3">
          {/* Now Showing Movies */}
          {currentMovies.length > 0 && (
            <div className="mb-5" data-aos="fade-up" data-aos-duration="600">
              <div className="d-flex justify-content-between align-items-center mb-4" data-aos="zoom-in" data-aos-delay="150">
                <h2 className="h3 text-white mb-0">
                  <FaFilm className="me-2 text-danger" />
                  Now Showing
                </h2>
              </div>

              <div data-aos="fade-up" data-aos-delay="300">
                <TrendingCarousel
                  movies={currentMovies.map((movie) =>
                    formatMovieForCarousel(movie, "Now Showing", "success")
                  )}
                  title=""
                />
              </div>
            </div>
          )}

          {/* Upcoming Movies */}
          {upcomingMovies.length > 0 && (
            <div className="mb-5" data-aos="fade-up" data-aos-duration="600" data-aos-delay="200">
              <div className="d-flex justify-content-between align-items-center mb-4" data-aos="zoom-in" data-aos-delay="350">
                <h2 className="h3 text-white mb-0">
                  <FaCalendarAlt className="me-2 text-warning" />
                  Coming Soon
                </h2>
              </div>

              <div data-aos="fade-up" data-aos-delay="500">
                <TrendingCarousel
                  movies={upcomingMovies.map((movie) =>
                    formatMovieForCarousel(movie, "Coming Soon", "warning")
                  )}
                  title=""
                />
              </div>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
};

export default Home;