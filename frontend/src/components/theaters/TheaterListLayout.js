import React from "react";
import { Badge } from "react-bootstrap";
import { FaHeart, FaUtensils, FaMobileAlt } from "react-icons/fa";
import "../../styles/theater-layout.css";

const TheaterListLayout = ({ theaters, onMovieClick }) => {
  const generateShowTimes = (theater) => {
    const times = ["10:30 AM", "01:45 PM", "05:15 PM", "08:30 PM", "11:00 PM"];
    const formats = theater.screens?.map(
      (screen) => screen.screenType || "2D"
    ) || ["2D", "IMAX", "3D"];
    const screenCount = theater.screens?.length || 2;
    return times.slice(0, Math.min(screenCount + 1, 4)).map((time, idx) => ({
      time,
      format: formats[idx % formats.length],
    }));
  };

  const getTheaterIcon = (theaterName) => {
    const name = theaterName?.toLowerCase() || "";
    if (name.includes("pvr"))
      return "https://assets-in.bmscdn.com/moviesmaster/movies-showtimes/v4/cinema-icon/pvr.png";
    if (name.includes("inox"))
      return "https://assets-in.bmscdn.com/moviesmaster/movies-showtimes/v4/cinema-icon/inox.png";
    if (name.includes("cinepolis"))
      return "https://assets-in.bmscdn.com/moviesmaster/movies-showtimes/v4/cinema-icon/cinepolis.png";
    return "https://assets-in.bmscdn.com/moviesmaster/movies-showtimes/v4/cinema-icon/pvr.png";
  };

  return (
    <div className="theater-list-container">
      {theaters.map((theater, index) => {
        const showTimes = theater.showTimes || generateShowTimes(theater);

        return (
          <div key={theater._id || index} className="theater-item">
            <div className="theater-header">
              <div className="theater-info">
                <div className="theater-brand">
                  {/* <img 
                    src={getTheaterIcon(theater.name)} 
                    alt="theater-icon"
                    className="theater-icon"
                  /> */}
                </div>
                <div className="theater-details">
                  <div className="theater-name-section">
                    <span className="theater-name">{theater.name}</span>
                    <img
                      src="https://assets-in.bmscdn.com/moviesmaster/movies-showtimes/v4/common/infoV2.png"
                      alt="info-icon"
                      className="info-icon"
                    />
                  </div>
                  <div className="theater-location">
                    📍 {theater.address?.city || theater.city}
                    {theater.screens?.length && (
                      <span
                        style={{
                          marginLeft: "12px",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        • {theater.screens.length} Screen
                        {theater.screens.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {theater.amenities && theater.amenities.length > 0 && (
              <div className="theater-amenities">
                <div className="amenities-list">
                  {theater.amenities.slice(0, 3).map((amenity, i) => (
                    <span key={i} className="amenity-tag">
                      {amenity}
                    </span>
                  ))}
                  {theater.amenities.length > 3 && (
                    <span className="amenity-tag more">
                      +{theater.amenities.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Active Movies Section */}
            <div className="active-movies">
              {theater.movies && theater.movies.length > 0 ? (
                theater.movies.slice(0, 3).map((movie, idx) => (
                  <div
                    key={movie._id}
                    className="movie-slot"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovieClick && onMovieClick(movie._id, theater);
                    }}
                  >
                    <div className="movie-slot-info">
                      <div className="movie-name">{movie.title}</div>
                      <div className="movie-screen">
                        Screen {movie.shows[0]?.screenNumber || idx + 1}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="movie-slot">
                  <div className="movie-slot-info">
                    <div className="movie-name">No Movies</div>
                    <div className="movie-screen">Available</div>
                  </div>
                </div>
              )}
              {theater.movies && theater.movies.length > 3 && (
                <div className="movie-slot more-slot">
                  <div className="movie-slot-info">
                    <div className="movie-name">
                      +{theater.movies.length - 3}
                    </div>
                    <div className="movie-screen">More</div>
                  </div>
                </div>
              )}
            </div>

            <div className="theater-policies">
              <div className="policy-info">
                <div className="policy-text">
                  <div className="cancellation-policy">
                    Cancellation available
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TheaterListLayout;
