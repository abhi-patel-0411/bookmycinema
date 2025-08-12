import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
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
  FaPlay,
  FaAward,
  FaGlobe,
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
    <div className="about-page" style={{ backgroundColor: '#1f2025', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="hero-section" style={{ paddingTop: '120px', paddingBottom: '80px', background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.1) 0%, #1f2025 100%)', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-background" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 80%, rgba(229, 9, 20, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(229, 9, 20, 0.1) 0%, transparent 50%)' }}></div>
        <Container className="position-relative">
          <Row className="justify-content-center text-center">
            <Col lg={10} xl={8}>
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="hero-content"
              >
                <div className="d-flex justify-content-center align-items-center mb-4">
                  <BrandLogo />
                </div>
                <p className="text-light mb-4" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontFamily: 'Inter, sans-serif', fontWeight: '400', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 2rem' }}>
                  Your premier destination for seamless movie booking experiences with cutting-edge technology
                </p>
                <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                  <div style={{ width: '60px', height: '2px', background: 'linear-gradient(135deg, transparent, #e50914, transparent)' }}></div>
                  <FaPlay className="text-danger" size={20} />
                  <div style={{ width: '60px', height: '2px', background: 'linear-gradient(135deg, transparent, #e50914, transparent)' }}></div>
                </div>
                <Button 
                  variant="danger" 
                  size="lg" 
                  className="px-5 py-3 fw-semibold"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '50px', fontSize: '1.1rem', letterSpacing: '0.5px' }}
                >
                  Explore Movies
                </Button>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 0', backgroundColor: '#1f2025' }}>
        <Container>
          <Row className="g-4">
            <Col md={4}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-100 border-0 shadow-lg" style={{ backgroundColor: '#1f2025', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Card.Body className="text-center p-4">
                    <div className="mb-3 p-3 rounded-circle d-inline-flex" style={{ background: 'linear-gradient(135deg, #e50914, #ff4757)' }}>
                      <FaFilm size={32} className="text-white" />
                    </div>
                    <h3 className="fw-bold text-white mb-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.5rem' }}>
                      {counters.movies.toLocaleString()}+
                    </h3>
                    <p className="text-light mb-0" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: '500' }}>Movies Available</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
            <Col md={4}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-100 border-0 shadow-lg" style={{ backgroundColor: '#1f2025', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Card.Body className="text-center p-4">
                    <div className="mb-3 p-3 rounded-circle d-inline-flex" style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}>
                      <FaUsers size={32} className="text-white" />
                    </div>
                    <h3 className="fw-bold text-white mb-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.5rem' }}>
                      {counters.users.toLocaleString()}+
                    </h3>
                    <p className="text-light mb-0" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: '500' }}>Happy Users</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
            <Col md={4}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Card className="h-100 border-0 shadow-lg" style={{ backgroundColor: '#1f2025', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Card.Body className="text-center p-4">
                    <div className="mb-3 p-3 rounded-circle d-inline-flex" style={{ background: 'linear-gradient(135deg, #ffc107, #fd7e14)' }}>
                      <FaTicketAlt size={32} className="text-white" />
                    </div>
                    <h3 className="fw-bold text-white mb-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.5rem' }}>
                      {counters.bookings.toLocaleString()}+
                    </h3>
                    <p className="text-light mb-0" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: '500' }}>Tickets Booked</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 0', backgroundColor: '#1f2025' }}>
        <Container>
          <Row className="justify-content-center mb-5">
            <Col lg={8} className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="fw-bold text-white mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(2rem, 4vw, 2.8rem)', letterSpacing: '-0.01em' }}>Why Choose Book My Cinema?</h2>
                <p className="text-light" style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', fontWeight: '400', lineHeight: '1.6' }}>
                  Experience the future of movie booking with our cutting-edge platform
                </p>
              </motion.div>
            </Col>
          </Row>
          <Row className="g-4">
            {features.map((feature, index) => (
              <Col key={index} lg={4} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="h-100 border-0 shadow-lg" style={{ backgroundColor: '#1f2025', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', transition: 'all 0.3s ease' }}>
                    <Card.Body className="text-center p-4">
                      <div className="mb-3 p-3 rounded-circle d-inline-flex" style={{ background: 'linear-gradient(135deg, #e50914, #ff4757)' }}>
                        {React.cloneElement(feature.icon, { size: 28, className: 'text-white' })}
                      </div>
                      <h4 className="fw-bold text-white mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.3rem' }}>{feature.title}</h4>
                      <p className="text-light mb-0" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', lineHeight: '1.6' }}>{feature.description}</p>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Mission Section */}
      <section style={{ padding: '100px 0', background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.05), #1f2025)' }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="fw-bold text-white mb-4" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(2rem, 4vw, 2.5rem)', letterSpacing: '-0.01em' }}>Our Mission</h2>
                <p className="text-light mb-4" style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', lineHeight: '1.8', fontWeight: '400' }}>
                  At Book My Cinema, we believe that going to the movies should be effortless and enjoyable. Our mission is to revolutionize the way people discover, book, and experience cinema by providing a seamless, user-friendly platform that connects movie lovers with their favorite films.
                </p>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-circle" style={{ background: 'linear-gradient(135deg, #e50914, #ff4757)' }}>
                      <FaClock className="text-white" size={16} />
                    </div>
                    <span className="text-white fw-medium" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}>24/7 Booking Available</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-circle" style={{ background: 'linear-gradient(135deg, #e50914, #ff4757)' }}>
                      <FaHeart className="text-white" size={16} />
                    </div>
                    <span className="text-white fw-medium" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}>Customer-Centric Approach</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-circle" style={{ background: 'linear-gradient(135deg, #e50914, #ff4757)' }}>
                      <FaAward className="text-white" size={16} />
                    </div>
                    <span className="text-white fw-medium" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}>Premium Quality Service</span>
                  </div>
                </div>
              </motion.div>
            </Col>
            <Col lg={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="d-flex justify-content-center"
              >
                <Card className="border-0 shadow-lg" style={{ backgroundColor: '#1f2025', backdropFilter: 'blur(20px)', borderRadius: '25px', maxWidth: '400px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Card.Body className="text-center p-5">
                    <div className="mb-4 p-4 rounded-circle d-inline-flex" style={{ background: 'linear-gradient(135deg, #e50914, #ff4757)' }}>
                      <FaGlobe size={48} className="text-white" />
                    </div>
                    <h3 className="fw-bold text-white mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem' }}>Premium Cinema Experience</h3>
                    <p className="text-light mb-0" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', lineHeight: '1.6' }}>Bringing the magic of movies to your fingertips with cutting-edge technology</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer Section */}
      <section style={{ padding: '80px 0 40px', backgroundColor: '#1f2025' }}>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="fw-bold text-white mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '2rem', letterSpacing: '-0.01em' }}>Ready to Start Your Journey?</h3>
                <p className="text-light mb-4" style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', lineHeight: '1.6', fontWeight: '400' }}>
                  Join thousands of movie enthusiasts who trust Book My Cinema for their entertainment needs.
                </p>
                <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                  <div style={{ width: '60px', height: '2px', background: 'linear-gradient(135deg, transparent, #e50914, transparent)' }}></div>
                  <FaStar className="text-warning" size={20} />
                  <div style={{ width: '60px', height: '2px', background: 'linear-gradient(135deg, transparent, #e50914, transparent)' }}></div>
                </div>
                <Button 
                  variant="outline-light" 
                  size="lg" 
                  className="px-5 py-3 fw-semibold mb-4"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '50px', fontSize: '1.1rem', letterSpacing: '0.5px' }}
                >
                  Get Started Today
                </Button>
                <p className="text-muted mt-4" style={{ fontSize: '0.9rem', fontFamily: 'Inter, sans-serif' }}>
                  © 2025 Book My Cinema. All rights reserved. Made with{" "}
                  <FaHeart className="text-danger mx-1" style={{ animation: 'heartBeat 1.5s ease-in-out infinite' }} /> for movie lovers.
                </p>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default About;
