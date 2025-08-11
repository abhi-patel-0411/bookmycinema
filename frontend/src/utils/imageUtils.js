// Utility function to construct proper image URLs
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace('/api', '');
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

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

export const getMoviePosterUrl = (posterPath, movieTitle = null) => {
  if (posterPath) {
    // If it's already a full URL, return as is
    if (posterPath.startsWith('http://') || posterPath.startsWith('https://')) {
      return posterPath;
    }
    // If it's a relative path, construct the full URL
    if (posterPath.startsWith('/')) {
      return `${API_BASE_URL}${posterPath}`;
    }
    // If it doesn't start with /, add it
    return `${API_BASE_URL}/${posterPath}`;
  }
  
  // Generate placeholder with movie title initial
  const initial = movieTitle ? movieTitle.charAt(0) : 'M';
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