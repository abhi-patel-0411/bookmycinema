import moment from "moment";
// Parse dates ("2025-08-21" → Date object)

// Format dates (Aug 21, 2025)
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

  console.log("Total movies to filter:", movies.length);

  // If no movies, return empty arrays
  if (!movies || movies.length === 0) {
    return { upcoming: [], current: [], featured: [] };
  }

  movies.forEach((movie) => {
    // Always add to featured first
    featured.push(movie);

    // Check if movie has valid start date first (priority over isUpcoming flag)
    if (movie.startDate) {
      const startDate = new Date(movie.startDate);
      startDate.setHours(0, 0, 0, 0);

      // Upcoming movies (start date is in the future)
      if (startDate > today) {
        upcoming.push(movie);
        console.log("Added upcoming movie by date:", movie.title);
      }
      // Current movies (start date is today or in the past)
      else {
        current.push(movie);
        console.log("Added current movie:", movie.title);
      }
    }
    // Only check isUpcoming flag if no start date is provided
    else if (movie.isUpcoming === true || movie.isUpcoming === "true") {
      upcoming.push(movie);
      console.log("Added upcoming movie by flag:", movie.title);
    } else {
      // If no start date and not marked as upcoming, add to current
      current.push(movie);
    }

    // Debug
    console.log(
      "Movie processed:",
      movie.title,
      "isUpcoming:",
      movie.isUpcoming,
      "startDate:",
      movie.startDate,
      "endDate:",
      movie.endDate
    );
  });

  console.log("Filtered results:", {
    upcoming: upcoming.length,
    current: current.length,
    featured: featured.length,
  });

  return {
    upcoming: upcoming,
    current: current,
    featured: featured,
  };
};

// @param tells what parameters this function expects.

// @returns tells what this function gives back.
/**
 * Format movie for display in carousel
 * @param {Object} movie - Movie object
 * @param {String} badgeText - Optional badge text
 * @param {String} badgeColor - Optional badge color
 * @returns {Object} Formatted movie object
 */

// Defines the function and exports it so it can be used in other files.

// It takes movie (object),

// badgeText (like "New", "Hot", optional),

// badgeColor (color for the badge, optional).

// Default values are null (means optional).
export const formatMovieForCarousel = (
  movie,
  badgeText = null,
  badgeColor = null
) => {
  if (!movie) return {};

  try {
    return {
      ...movie,
      id:
        movie._id ||
        movie.id ||
        `movie-${Math.random().toString(36).substr(2, 9)}`,
      image: movie.poster || movie.image || null,
      genre: Array.isArray(movie.genre)
        ? movie.genre.join(", ")
        : movie.genre || "Action",
      badge: badgeText,
      badgeColor: badgeColor,
      releaseDate: movie.startDate
        ? moment(movie.startDate).format("MMM DD, YYYY")
        : null,
      // Simplified theater information
      theaters:
        movie.theaters && Array.isArray(movie.theaters)
          ? movie.theaters.map((theater) => theater.name || theater).join(", ")
          : null,
    };
  } catch (error) {
    console.error("Error formatting movie:", error);
    return {
      ...movie,
      id:
        movie._id ||
        movie.id ||
        `movie-${Math.random().toString(36).substr(2, 9)}`,
      image: null,
      genre: "Action",
      badge: badgeText,
      badgeColor: badgeColor,
    };
  }
};
