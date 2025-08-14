import React, { useState, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getMoviePosterUrl } from '../../utils/imageUtils';
import '../../styles/trending-carousel.css';

const TrendingCarousel = ({ movies = [], title = "Recommended Movies" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [cardWidth, setCardWidth] = useState(216);
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const updateLayout = () => {
      if (window.innerWidth <= 480) {
        setItemsPerView(2.5);
        setCardWidth(136);
      } else if (window.innerWidth <= 576) {
        setItemsPerView(2.8);
        setCardWidth(156);
      } else if (window.innerWidth <= 768) {
        setItemsPerView(3.2);
        setCardWidth(176);
      } else if (window.innerWidth <= 1024) {
        setItemsPerView(4);
        setCardWidth(216);
      } else {
        setItemsPerView(5);
        setCardWidth(216);
      }
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);
  
  const nextSlide = () => {
    const maxIndex = Math.max(0, displayMovies.length - Math.floor(itemsPerView));
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const defaultMovies = [
    { id: 1, title: "Metro... In Dino", genre: "Drama/Romantic", image: "https://picsum.photos/200/280?random=11" },
    { id: 2, title: "Jurassic World: Rebirth", genre: "Action/Sci-Fi/Thriller", image: "https://picsum.photos/200/280?random=12" },
    { id: 3, title: "Sitaare Zameen Par", genre: "Comedy/Drama/Sports", image: "https://picsum.photos/200/280?random=13" },
    { id: 4, title: "Maa", genre: "Fantasy/Horror/Mythological", image: "https://picsum.photos/200/280?random=14" },
    { id: 5, title: "F1: The Movie", genre: "Action/Drama/Sports", image: "https://picsum.photos/200/280?random=15" },
    { id: 6, title: "Deda", genre: "Drama/Family", image: "https://picsum.photos/200/280?random=16" },
    { id: 7, title: "Jalebi Rocks", genre: "Drama/Family", image: "https://picsum.photos/200/280?random=17" },
    { id: 8, title: "Kannappa", genre: "Action/Drama/Fantasy", image: "https://picsum.photos/200/280?random=18" },
  ];

  const displayMovies = movies.length > 0 ? movies : defaultMovies;

  return (
    <div className="trending-carousel-container">
      <div className="trending-header">
        <h2 className="trending-title">{title}</h2>
        <a href="/movies" className="see-all-link">See All ›</a>
      </div>
      
      <div className="carousel-wrapper">
        <div 
          ref={carouselRef}
          className="carousel-container"
          style={{ transform: `translateX(-${currentIndex * cardWidth}px)` }}
        >
          {displayMovies.map((movie, index) => {
            // Ensure movie has an ID for navigation
            const movieId = movie.id || movie._id || `movie-${index}`;
            // Ensure movie has a title
            const movieTitle = movie.title || 'Untitled Movie';
            // Ensure movie has an image
            const movieImage = getMoviePosterUrl(movie.poster || movie.image, movieTitle) || 'https://picsum.photos/200/280?random=20';
            // Ensure movie has a genre
            const movieGenre = Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre || 'Drama');
            
            return (
              <div 
                key={movieId} 
                className="movie-card-carousel"
                onClick={() => navigate(`/movie/${movieId}`)}
                style={{ cursor: 'pointer' }}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
                data-aos-duration="500"
              >
                <div className="card-inner">
                  <div className="position-relative">
                    <img 
                      src={movieImage} 
                      alt={movieTitle}
                      className="movie-image-carousel"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://picsum.photos/200/280?random=20';
                      }}
                    />
                    {movie.badge && (
                      <span className={`position-absolute badge bg-${movie.badgeColor || 'primary'}`} 
                        style={{ 
                          top: '10px', 
                          right: '10px', 
                          fontSize: '0.7rem',
                          padding: '5px 8px',
                          borderRadius: '4px'
                        }}>
                        {movie.badge}
                      </span>
                    )}
                  </div>
                  <div className="movie-info-carousel">
                    <h3 className="movie-title-carousel">{movieTitle}</h3>
                    <p className="movie-genre-carousel">{movieGenre}</p>
                    {movie.badge === 'Coming Soon' && movie.releaseDate && (
                      <p className="movie-release-date">
                        <FaCalendarAlt className="me-1" size={10} />
                        {movie.releaseDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {currentIndex > 0 && (
          <button className="carousel-nav carousel-nav-left" onClick={prevSlide}>
            <FaChevronLeft />
          </button>
        )}
        
        {currentIndex < displayMovies.length - Math.floor(itemsPerView) && (
          <button className="carousel-nav carousel-nav-right" onClick={nextSlide}>
            <FaChevronRight />
          </button>
        )}
      </div>
    </div>
  );
};

export default TrendingCarousel;