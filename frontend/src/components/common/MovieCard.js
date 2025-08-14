import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaStar, FaPlay, FaClock, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ReactStars from 'react-rating-stars-component';
import { getMoviePosterUrl } from '../../utils/imageUtils';

const MovieCard = ({ movie, index = 0 }) => {
  const navigate = useNavigate();
  const [movieRating, setMovieRating] = useState({ averageRating: 0, totalRatings: 0 });

  useEffect(() => {
    const fetchMovieRating = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/ratings/movie/${movie._id}`);
        if (response.ok) {
          const data = await response.json();
          setMovieRating({
            averageRating: parseFloat(data.averageRating) || 0,
            totalRatings: data.totalRatings || 0
          });
        }
      } catch (error) {
        console.error('Error fetching movie rating:', error);
      }
    };

    if (movie._id) {
      fetchMovieRating();
    }
  }, [movie._id]);

  const handleCardClick = () => {
    navigate(`/movie/${movie._id}`);
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
      className="movie-card-container"
      style={{ borderRadius: '12px', overflow: 'hidden' }}
      data-aos="zoom-in"
      data-aos-delay={index * 100}
      data-aos-duration="600"
    >
      <Card 
        className="movie-card h-100 border-0 shadow-sm"
        onClick={handleCardClick}
        style={{ cursor: 'pointer', borderRadius: '12px', background: '#2a2d35' }}
      >
        <div className="position-relative overflow-hidden" style={{ borderRadius: '12px 12px 0 0' }}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="poster-container"
            style={{ overflow: 'hidden' }}
          >
            <img
              src={getMoviePosterUrl(movie.poster, movie.title)}
              alt={movie.title}
              className="movie-poster"
              style={{ height: '220px', width: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/300x450/1e293b/ffffff?text=${encodeURIComponent(movie.title.charAt(0))}`;
              }}
            />
          </motion.div>
          
          {/* Rating badge */}
          <div 
            className="position-absolute top-0 end-0 m-2 px-2 py-1 rounded-pill d-flex align-items-center"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(5px)'
            }}
          >
            <FaStar className="text-warning me-1" size={12} />
            <small className="text-white fw-bold">
              {movieRating.averageRating > 0 ? movieRating.averageRating.toFixed(1) : 'N/A'}
            </small>
          </div>

          {/* Genre badge */}
          {movie.genre && (
            <div 
              className="position-absolute bottom-0 start-0 m-2 px-2 py-1 rounded-pill"
              style={{
                background: 'rgba(229, 9, 20, 0.8)',
                fontSize: '0.7rem'
              }}
            >
              <small className="text-white fw-bold">
                {Array.isArray(movie.genre) ? movie.genre[0] : movie.genre}
              </small>
            </div>
          )}
        </div>

        <Card.Body className="p-3">
          <h6 className="text-white fw-bold mb-2 text-truncate">
            {movie.title}
          </h6>
          
          <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.75rem' }}>
            {movie.duration && (
              <div className="d-flex align-items-center text-secondary">
                <FaClock className="me-1" size={10} />
                <span>{formatDuration(movie.duration)}</span>
              </div>
            )}
            
            {movie.releaseDate && (
              <div className="d-flex align-items-center text-secondary">
                <FaCalendarAlt className="me-1" size={10} />
                <span>{new Date(movie.releaseDate).getFullYear()}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn btn-danger w-100 rounded-pill mt-2"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0' }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/movie/${movie._id}`);
            }}
          >
            Book Now
          </motion.button>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default MovieCard;