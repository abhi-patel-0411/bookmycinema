// Utility function to construct proper image URLs
const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const getImageUrl = (imagePath, fallbackUrl = null) => {
  if (!imagePath) return fallbackUrl;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, prepend the API base URL
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // If it doesn't start with /, add it
  return `${API_BASE_URL}/${imagePath}`;
};

export const getMoviePosterUrl = (movie, fallbackText = null) => {
  if (movie && movie.poster) {
    // If it's already a full URL, return as is
    if (movie.poster.startsWith('http://') || movie.poster.startsWith('https://')) {
      return movie.poster;
    }
    // If it's a relative path, construct the full URL
    if (movie.poster.startsWith('/')) {
      return `${API_BASE_URL}${movie.poster}`;
    }
    // If it doesn't start with /, add it
    return `${API_BASE_URL}/${movie.poster}`;
  }
  
  // Generate placeholder with movie title initial
  const initial = fallbackText || (movie && movie.title ? movie.title.charAt(0) : 'M');
  return `https://via.placeholder.com/300x450/1e293b/ffffff?text=${encodeURIComponent(initial)}`;
};

export const getCastImageUrl = (castMember) => {
  if (castMember.image) {
    return getImageUrl(castMember.image);
  }
  
  // Generate avatar with cast member name
  const name = castMember.name || 'Actor';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=80`;
};