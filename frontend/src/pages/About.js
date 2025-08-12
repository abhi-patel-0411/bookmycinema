import React, { useEffect, useState } from "react";
import {
  FaFilm,
  FaTicketAlt,
  FaShieldAlt,
  FaMobile,
  FaMapMarkerAlt,
  FaStar,
  FaUsers,
  FaClock,
  FaHeart,
} from "react-icons/fa";
import "./About.css";
import BrandLogo from "../components/common/BrandLogo";

const About = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({
    movies: 0,
    users: 0,
    bookings: 0,
  });

  useEffect(() => {
    setIsVisible(true);

    // Animate counters
    const animateCounters = () => {
      const targets = { movies: 500, users: 10000, bookings: 50000 };
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;

        setCounters({
          movies: Math.floor(targets.movies * progress),
          users: Math.floor(targets.users * progress),
          bookings: Math.floor(targets.bookings * progress),
        });

        if (step >= steps) {
          clearInterval(timer);
          setCounters(targets);
        }
      }, stepTime);
    };

    const timer = setTimeout(animateCounters, 500);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <FaFilm />,
      title: "Latest Movies",
      description:
        "Browse and discover the newest blockbusters and indie films",
    },
    {
      icon: <FaTicketAlt />,
      title: "Easy Booking",
      description: "Simple seat selection and instant booking confirmation",
    },
    {
      icon: <FaShieldAlt />,
      title: "Secure Payments",
      description: "Safe and encrypted payment processing for peace of mind",
    },
    {
      icon: <FaMobile />,
      title: "Mobile Friendly",
      description: "Optimized experience across all devices and screen sizes",
    },
    {
      icon: <FaMapMarkerAlt />,
      title: "Multiple Theaters",
      description:
        "Find showtimes at theaters near you with detailed information",
    },
    {
      icon: <FaStar />,
      title: "Premium Experience",
      description: "Enjoy a seamless and delightful movie booking journey",
    },
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className={`hero-section ${isVisible ? "animate-in" : ""}`}>
        <div className="hero-background"></div>
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <div className="hero-content">
                <div className="hero-title text-center d-flex justify-content-center">
                  <BrandLogo />
                </div>
                <p className="hero-subtitle">
                  Your premier destination for seamless movie booking
                  experiences
                </p>
                <div className="hero-decoration">
                  <div className="decoration-line"></div>
                  <FaFilm className="decoration-icon" />
                  <div className="decoration-line"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaFilm />
                </div>
                <div className="stat-number">
                  {counters.movies.toLocaleString()}+
                </div>
                <div className="stat-label">Movies Available</div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-number">
                  {counters.users.toLocaleString()}+
                </div>
                <div className="stat-label">Happy Users</div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaTicketAlt />
                </div>
                <div className="stat-number">
                  {counters.bookings.toLocaleString()}+
                </div>
                <div className="stat-label">Tickets Booked</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Why Choose CineBook?</h2>
              <p className="section-subtitle">
                Experience the future of movie booking with our cutting-edge
                platform
              </p>
            </div>
          </div>
          <div className="row">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-4 col-md-6 mb-4">
                <div className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h4 className="feature-title">{feature.title}</h4>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="mission-content">
                <h2 className="mission-title">Our Mission</h2>
                <p className="mission-text">
                  At CineBook, we believe that going to the movies should be
                  effortless and enjoyable. Our mission is to revolutionize the
                  way people discover, book, and experience cinema by providing
                  a seamless, user-friendly platform that connects movie lovers
                  with their favorite films.
                </p>
                <div className="mission-highlights">
                  <div className="highlight-item">
                    <FaClock className="highlight-icon" />
                    <span>24/7 Booking Available</span>
                  </div>
                  <div className="highlight-item">
                    <FaHeart className="highlight-icon" />
                    <span>Customer-Centric Approach</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="mission-visual">
                <div className="visual-card">
                  <div className="visual-content">
                    <FaFilm className="visual-icon" />
                    <h3>Premium Cinema Experience</h3>
                    <p>Bringing the magic of movies to your fingertips</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="about-footer">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <div className="footer-content">
                <h3 className="footer-title">Ready to Start Your Journey?</h3>
                <p className="footer-text">
                  Join thousands of movie enthusiasts who trust CineBook for
                  their entertainment needs.
                </p>
                <div className="footer-decoration">
                  <div className="decoration-line"></div>
                  <FaStar className="decoration-icon" />
                  <div className="decoration-line"></div>
                </div>
                <p className="copyright">
                  © 2025 Book My Cinema. All rights reserved. Made with{" "}
                  <FaHeart className="heart-icon" /> for movie lovers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
