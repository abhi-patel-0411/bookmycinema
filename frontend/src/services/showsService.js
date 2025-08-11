import api from './api';

const showsService = {
  // Get all shows (legacy method)
  getAll: async () => {
    const response = await api.get('/shows');
    return response;
  },

  // Get shows by movie and date
  getShowsByMovieAndDate: async ({ movieId, city, date }) => {
    try {
      console.log(`Fetching shows for movie ${movieId} in ${city} on ${date}`);
      const response = await api.get(`/shows/movie/${movieId}?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`);
      console.log(`Received ${response.data?.length || 0} shows from API`);
      return response;
    } catch (error) {
      console.error('Error in getShowsByMovieAndDate:', error);
      throw error;
    }
  },

  // Get shows by movie with optional filters
  getShowsByMovie: async (movieId, filters = {}) => {
    let url = `/shows/movie/${movieId}`;
    const params = new URLSearchParams();
    
    if (filters.date) params.append('date', filters.date);
    if (filters.city) params.append('city', filters.city);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response;
  },

  // Get all current shows with optional filter
  getAllShows: async (currentOnly = false) => {
    let url = '/shows';
    if (currentOnly) {
      url += '?current=true';
    }
    const response = await api.get(url);
    return response;
  },

  // Get show by ID
  getById: async (id) => {
    const response = await api.get(`/shows/${id}`);
    return response;
  },

  // Get cities with shows
  getCities: async () => {
    try {
      const response = await api.get('/shows/cities');
      return response;
    } catch (error) {
      // Return default cities if API fails
      return {
        data: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad']
      };
    }
  },

  // Create show (admin)
  create: async (showData) => {
    const response = await api.post('/shows', showData);
    return response;
  },

  // Update show (admin)
  update: async (id, showData) => {
    const response = await api.put(`/shows/${id}`, showData);
    return response;
  },

  // Delete show (admin)
  delete: async (id) => {
    const response = await api.delete(`/shows/${id}`);
    return response;
  },

  // Force delete show with bookings (admin)
  forceDelete: async (id) => {
    const response = await api.delete(`/shows/${id}/force`);
    return response;
  }
};

export default showsService;