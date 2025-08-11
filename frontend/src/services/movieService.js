import moment from 'moment';

/**
 * Filter movies by their showing status
 * @param {Array} movies - Array of movie objects
 * @returns {Object} Object containing filtered movie arrays
 */
export const filterMoviesByStatus = (movies) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcoming = [];
  const current = [];
  const featured = [];
  
  console.log('Total movies to filter:', movies.length);
  
  // If no movies, return empty arrays
  if (!movies || movies.length === 0) {
    return { upcoming: [], current: [], featured: [] };
  }
  
  movies.forEach(movie => {
    // Always add to featured first
    featured.push(movie);
    
    // Check if movie has valid dates first (priority over isUpcoming flag)
    if (movie.startDate && movie.endDate) {
      const startDate = new Date(movie.startDate);
      const endDate = new Date(movie.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Upcoming movies (start date is in the future)
      if (startDate > today) {
        upcoming.push(movie);
        console.log('Added upcoming movie by date:', movie.title);
      }
      // Current movies (today is same as start date OR between start and end date)
      else if (today >= startDate && today <= endDate) {
        current.push(movie);
        console.log('Added current movie:', movie.title);
      } else {
        // If dates are in the past, still add to current for display
        current.push(movie);
      }
    }
    // Only check isUpcoming flag if no dates are provided
    else if (movie.isUpcoming === true || movie.isUpcoming === 'true') {
      upcoming.push(movie);
      console.log('Added upcoming movie by flag:', movie.title);
    }
    else {
      // If no dates and not marked as upcoming, add to current
      current.push(movie);
    }
    
    // Debug
    console.log('Movie processed:', movie.title, 
      'isUpcoming:', movie.isUpcoming, 
      'startDate:', movie.startDate, 
      'endDate:', movie.endDate);
  });
  
  console.log('Filtered results:', {
    upcoming: upcoming.length,
    current: current.length,
    featured: featured.length
  });
  
  return {
    upcoming: upcoming.length > 0 ? upcoming : movies.slice(0, 3),
    current: current.length > 0 ? current : movies.slice(0, 5),
    featured: featured.length > 0 ? featured : movies
  };
};

/**
 * Format movie for display in carousel
 * @param {Object} movie - Movie object
 * @param {String} badgeText - Optional badge text
 * @param {String} badgeColor - Optional badge color
 * @returns {Object} Formatted movie object
 */
export const formatMovieForCarousel = (movie, badgeText = null, badgeColor = null) => {
  if (!movie) return {};
  
  try {
    return {
      ...movie,
      id: movie._id || movie.id || `movie-${Math.random().toString(36).substr(2, 9)}`,
      image: movie.poster || movie.image || null,
      genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre || "Action"),
      badge: badgeText,
      badgeColor: badgeColor,
      releaseDate: movie.startDate ? moment(movie.startDate).format('MMM DD, YYYY') : null,
      // Simplified theater information
      theaters: movie.theaters && Array.isArray(movie.theaters) 
        ? movie.theaters.map(theater => theater.name || theater).join(', ') 
        : null
    };
  } catch (error) {
    console.error('Error formatting movie:', error);
    return {
      ...movie,
      id: movie._id || movie.id || `movie-${Math.random().toString(36).substr(2, 9)}`,
      image: null,
      genre: "Action",
      badge: badgeText,
      badgeColor: badgeColor
    };
  }
};