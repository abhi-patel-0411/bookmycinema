# Frontend Services Documentation - BookMyCinema

## Table of Contents
1. [Overview](#overview)
2. [Services Architecture](#services-architecture)
3. [Individual Service Files](#individual-service-files)
4. [API Integration](#api-integration)
5. [Data Flow](#data-flow)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Overview

The services layer in BookMyCinema frontend handles all external API communications, data processing, and business logic. It acts as an intermediary between React components and backend APIs.

### Services Structure:
```
src/services/
├── api/
│   ├── index.js          - Main API configuration
│   ├── moviesAPI.js      - Movie-specific API calls
│   ├── showsAPI.js       - Show-related endpoints
│   └── theatersAPI.js    - Theater management APIs
├── api.js                - Centralized API service
├── axios.js              - Axios configuration
├── clerkService.js       - Clerk authentication service
├── clerkSyncService.js   - User synchronization
├── movieService.js       - Movie data processing
└── showsService.js       - Show data utilities
```

---

## Services Architecture

### Service Layer Pattern
```javascript
// Service Structure
const ServiceName = {
  // CRUD Operations
  getAll: (params) => api.get('/endpoint', { params }),
  getById: (id) => api.get(`/endpoint/${id}`),
  create: (data) => api.post('/endpoint', data),
  update: (id, data) => api.put(`/endpoint/${id}`, data),
  delete: (id) => api.delete(`/endpoint/${id}`),
  
  // Business Logic
  processData: (rawData) => { /* transformation logic */ },
  validateData: (data) => { /* validation logic */ }
};
```

### Data Flow Architecture
```
React Component → Service Layer → API Layer → Backend
     ↓              ↓              ↓           ↓
State Update ← Data Processing ← Response ← Database
```

---

## Individual Service Files

### 1. api.js - Central API Service

**Purpose**: Main API configuration and centralized endpoint management

#### Configuration Setup:
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**How it works**:
1. Creates axios instance with base URL
2. Sets default headers for JSON communication
3. Provides consistent API configuration across app

#### Request Interceptor:
```javascript
api.interceptors.request.use(async (config) => {
  // Handle FormData - remove Content-Type for multipart
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  // Try Clerk authentication first
  if (window.Clerk && window.Clerk.session) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    } catch (error) {
      console.log('Failed to get Clerk token:', error);
    }
  }
  
  // Fallback to localStorage token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**How it works**:
1. **FormData Handling**: Removes Content-Type for file uploads
2. **Clerk Integration**: Attempts to get Clerk session token
3. **Fallback Authentication**: Uses localStorage token if Clerk fails
4. **Authorization Header**: Adds Bearer token to all requests

#### Movies API:
```javascript
export const moviesAPI = {
  getAll: (showExpired, isAdmin) => {
    const params = {};
    if (showExpired) params.showExpired = showExpired;
    if (isAdmin) params.isAdmin = isAdmin;
    return api.get('/movies', { params });
  },
  getById: (id) => api.get(`/movies/${id}`),
  getShows: (id, params) => api.get(`/movies/${id}/shows`, { params }),
  create: (formData) => api.post('/movies', formData),
  update: (id, formData) => api.put(`/movies/${id}`, formData),
  delete: (id) => api.delete(`/movies/${id}`),
  softDelete: (id) => api.put(`/movies/${id}/deactivate`)
};
```

**Flow Explanation**:
1. **getAll**: Fetches movie list with optional filters
2. **getById**: Retrieves specific movie details
3. **getShows**: Gets shows for a specific movie
4. **create/update**: Handles FormData for file uploads
5. **delete/softDelete**: Hard and soft deletion options

#### Theaters API:
```javascript
export const theatersAPI = {
  getAll: (params) => api.get('/theaters', { params }),
  getById: (id) => api.get(`/theaters/${id}`),
  create: (data) => api.post('/theaters', data),
  update: (id, data) => api.put(`/theaters/${id}`, data),
  delete: (id) => api.delete(`/theaters/${id}`),
  addShow: (id, data) => api.post(`/theaters/${id}/shows`, data)
};
```

#### Bookings API:
```javascript
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`)
};
```

#### Shows API:
```javascript
export const showsAPI = {
  getAll: () => api.get('/shows'),
  getById: (id) => api.get(`/shows/${id}`),
  getByMovie: (movieId, params) => api.get(`/shows/movie/${movieId}`, { params }),
  create: (data) => api.post('/shows', data),
  update: (id, data) => api.put(`/shows/${id}`, data),
  delete: (id) => api.delete(`/shows/${id}`)
};
```

#### Admin API:
```javascript
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getBookings: () => api.get('/admin/bookings'),
  getShows: () => api.get('/admin/shows'),
  updateShow: (id, data) => api.put(`/admin/shows/${id}`, data),
  deleteShow: (id) => api.delete(`/admin/shows/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateBookingStatus: (id, data) => api.put(`/admin/bookings/${id}/status`, data),
  deleteBooking: (id) => api.delete(`/admin/bookings/${id}`)
};
```

### 2. movieService.js - Movie Data Processing

**Purpose**: Handles movie data transformation and business logic

#### Movie Status Filtering:
```javascript
export const filterMoviesByStatus = (movies) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcoming = [];
  const current = [];
  const featured = [];
  
  movies.forEach(movie => {
    // Always add to featured first
    featured.push(movie);
    
    // Check if movie has valid start date first
    if (movie.startDate) {
      const startDate = new Date(movie.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      // Upcoming movies (start date is in the future)
      if (startDate > today) {
        upcoming.push(movie);
      }
      // Current movies (start date is today or in the past)
      else {
        current.push(movie);
      }
    }
    // Only check isUpcoming flag if no start date
    else if (movie.isUpcoming === true || movie.isUpcoming === 'true') {
      upcoming.push(movie);
    }
    else {
      current.push(movie);
    }
  });
  
  return { upcoming, current, featured };
};
```

**How it works**:
1. **Date Normalization**: Sets time to 00:00:00 for accurate comparison
2. **Priority Logic**: Start date takes precedence over isUpcoming flag
3. **Categorization**: Splits movies into upcoming, current, and featured
4. **Fallback Logic**: Handles missing dates gracefully

#### Movie Formatting for Display:
```javascript
export const formatMovieForCarousel = (movie, badgeText = null, badgeColor = null) => {
  try {
    return {
      ...movie,
      id: movie._id || movie.id || `movie-${Math.random().toString(36).substr(2, 9)}`,
      image: movie.poster || movie.image || null,
      genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre || "Action"),
      badge: badgeText,
      badgeColor: badgeColor,
      releaseDate: movie.startDate ? moment(movie.startDate).format('MMM DD, YYYY') : null,
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
```

**How it works**:
1. **ID Generation**: Ensures every movie has a unique ID
2. **Image Handling**: Uses poster or image field with fallback
3. **Genre Processing**: Converts array to string or provides default
4. **Date Formatting**: Formats release date using moment.js
5. **Theater Processing**: Handles theater array or string
6. **Error Handling**: Provides fallback object on errors

---

## API Integration

### Request Flow:
```
Component → Service Function → API Call → Backend → Database
    ↓           ↓               ↓          ↓         ↓
Response ← Data Processing ← HTTP Response ← API Response ← Query Result
```

### Example API Call Flow:
```javascript
// 1. Component calls service
const fetchMovies = async () => {
  try {
    setLoading(true);
    const response = await moviesAPI.getAll();
    const processedMovies = filterMoviesByStatus(response.data);
    setMovies(processedMovies);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// 2. Service makes API call
moviesAPI.getAll() → api.get('/movies')

// 3. Interceptor adds authentication
config.headers.Authorization = `Bearer ${token}`

// 4. Request sent to backend
GET /api/movies with Authorization header

// 5. Backend processes and responds
{ data: [...movies], status: 200 }

// 6. Service processes response
filterMoviesByStatus(response.data)

// 7. Component updates state
setMovies(processedMovies)
```

### Authentication Flow:
```javascript
// 1. Check Clerk session
if (window.Clerk && window.Clerk.session) {
  const token = await window.Clerk.session.getToken();
}

// 2. Fallback to localStorage
const token = localStorage.getItem('token');

// 3. Add to request headers
config.headers.Authorization = `Bearer ${token}`;

// 4. Backend validates token
// 5. Request processed or rejected
```

---

## Data Flow

### Component to Service Flow:
```javascript
// Component
const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchMovies();
  }, []);
  
  const fetchMovies = async () => {
    try {
      setLoading(true);
      // Call service
      const response = await moviesAPI.getAll();
      // Process data
      const categorized = filterMoviesByStatus(response.data);
      // Update state
      setMovies(categorized);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {loading ? <Loader /> : <MovieGrid movies={movies} />}
    </div>
  );
};
```

### Service Processing Flow:
```javascript
// 1. Raw API Response
{
  data: [
    {
      _id: "123",
      title: "Movie 1",
      startDate: "2024-02-01",
      isUpcoming: false,
      genre: ["Action", "Drama"]
    }
  ]
}

// 2. Service Processing
const processedData = filterMoviesByStatus(response.data);

// 3. Processed Result
{
  upcoming: [],
  current: [
    {
      _id: "123",
      title: "Movie 1",
      startDate: "2024-02-01",
      genre: "Action, Drama"
    }
  ],
  featured: [...]
}

// 4. Component State Update
setMovies(processedData);
```

---

## Error Handling

### Service Level Error Handling:
```javascript
// API Service Error Handling
export const moviesAPI = {
  getAll: async (showExpired, isAdmin) => {
    try {
      const params = {};
      if (showExpired) params.showExpired = showExpired;
      if (isAdmin) params.isAdmin = isAdmin;
      
      const response = await api.get('/movies', { params });
      return response;
    } catch (error) {
      console.error('Movies API Error:', error);
      
      // Handle specific error types
      if (error.response?.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      }
      
      if (error.response?.status === 404) {
        throw new Error('Movies not found');
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw error;
    }
  }
};
```

### Component Error Handling:
```javascript
const MovieComponent = () => {
  const [error, setError] = useState(null);
  
  const handleAPICall = async () => {
    try {
      setError(null);
      const response = await moviesAPI.getAll();
      // Process response
    } catch (error) {
      setError(error.message || 'An error occurred');
    }
  };
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return <MovieList />;
};
```

### Global Error Interceptor:
```javascript
// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      // Show access denied message
      toast.error('Access denied');
    }
    
    return Promise.reject(error);
  }
);
```

---

## Best Practices

### 1. Service Organization:
```javascript
// Group related functions
export const movieService = {
  // CRUD operations
  api: {
    getAll: () => api.get('/movies'),
    getById: (id) => api.get(`/movies/${id}`),
    create: (data) => api.post('/movies', data)
  },
  
  // Business logic
  utils: {
    filterByStatus: (movies) => { /* logic */ },
    formatForDisplay: (movie) => { /* logic */ }
  },
  
  // Validation
  validation: {
    validateMovie: (movie) => { /* validation */ }
  }
};
```

### 2. Error Handling:
```javascript
// Consistent error handling
const handleAPIError = (error, context) => {
  console.error(`${context} Error:`, error);
  
  if (error.response) {
    // Server responded with error status
    return error.response.data.message || 'Server error';
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};
```

### 3. Data Transformation:
```javascript
// Consistent data transformation
export const transformMovieData = (rawMovie) => {
  return {
    id: rawMovie._id,
    title: rawMovie.title || 'Untitled',
    poster: rawMovie.poster || '/default-poster.jpg',
    genre: Array.isArray(rawMovie.genre) 
      ? rawMovie.genre.join(', ') 
      : rawMovie.genre || 'Unknown',
    duration: rawMovie.duration || 0,
    rating: rawMovie.rating || 0,
    isActive: rawMovie.isActive !== false
  };
};
```

### 4. Caching Strategy:
```javascript
// Simple caching implementation
const cache = new Map();

export const getCachedMovies = async (forceRefresh = false) => {
  const cacheKey = 'movies';
  const cacheTime = 5 * 60 * 1000; // 5 minutes
  
  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }
  }
  
  const response = await moviesAPI.getAll();
  cache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data;
};
```

### 5. Loading States:
```javascript
// Service with loading state management
export const useMovieService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await moviesAPI.getAll();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { fetchMovies, loading, error };
};
```

---

## Performance Considerations

### 1. Request Optimization:
- Use query parameters for filtering instead of client-side filtering
- Implement pagination for large datasets
- Cache frequently accessed data
- Debounce search requests

### 2. Data Processing:
- Process data in services, not components
- Use memoization for expensive calculations
- Implement lazy loading for large lists
- Optimize image loading and caching

### 3. Error Recovery:
- Implement retry logic for failed requests
- Provide fallback data when possible
- Use optimistic updates for better UX
- Handle offline scenarios gracefully

---

## Testing Services

### Unit Testing:
```javascript
// Test service functions
describe('movieService', () => {
  describe('filterMoviesByStatus', () => {
    it('should categorize movies correctly', () => {
      const movies = [
        { title: 'Current Movie', startDate: '2024-01-01' },
        { title: 'Upcoming Movie', startDate: '2024-12-01' }
      ];
      
      const result = filterMoviesByStatus(movies);
      
      expect(result.current).toHaveLength(1);
      expect(result.upcoming).toHaveLength(1);
    });
  });
});
```

### API Testing:
```javascript
// Mock API calls
jest.mock('../services/api');

describe('moviesAPI', () => {
  it('should fetch movies', async () => {
    const mockMovies = [{ title: 'Test Movie' }];
    api.get.mockResolvedValue({ data: mockMovies });
    
    const result = await moviesAPI.getAll();
    
    expect(api.get).toHaveBeenCalledWith('/movies', { params: {} });
    expect(result.data).toEqual(mockMovies);
  });
});
```

---

## Conclusion

The services layer provides:

- **Centralized API Management**: Single source for all API calls
- **Data Processing**: Business logic and data transformation
- **Error Handling**: Consistent error management across the app
- **Authentication**: Automatic token management
- **Caching**: Performance optimization through data caching
- **Type Safety**: Consistent data structures and validation

This architecture ensures maintainable, scalable, and robust API integration for the BookMyCinema frontend application.