import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  // Don't set Content-Type for FormData - let browser set it with boundary
  //config.data -body request
  //instanceof FormData checks: is the request body a FormData object
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  // Try to get Clerk token from window (if available)
  if (
    window.Clerk &&
    window.Clerk.session &&
    typeof window.Clerk.session.getToken === "function"
  ) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    } catch (error) {
      // Silently handle Clerk token errors
    }
  }

  // Fallback to localStorage token
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK" || !navigator.onLine) {
      error.isNetworkError = true;
      console.warn("Network error detected:", error.message);
    }
    return Promise.reject(error);
  }
);

// Movies API
export const moviesAPI = {
  getAll: (showExpired, isAdmin) => {
    const params = {};
    if (showExpired) params.showExpired = showExpired;
    if (isAdmin) params.isAdmin = isAdmin;
    return api.get("/movies", { params });
  },
  getById: (id) => api.get(`/movies/${id}`),
  getShows: (id, params) => api.get(`/movies/${id}/shows`, { params }),
  create: (formData) => {
    return api.post("/movies", formData);
  },
  update: (id, formData) => {
    return api.put(`/movies/${id}`, formData);
  },
  delete: (id) => api.delete(`/movies/${id}`),
  softDelete: (id) => api.put(`/movies/${id}/deactivate`),
};

// Theaters API
export const theatersAPI = {
  getAll: (params) => api.get("/theaters", { params }),
  getById: (id) => api.get(`/theaters/${id}`),
  create: (data) => api.post("/theaters", data),
  update: (id, data) => api.put(`/theaters/${id}`, data),
  delete: (id) => api.delete(`/theaters/${id}`),
  addShow: (id, data) => api.post(`/theaters/${id}/shows`, data),
};

// Bookings API
export const bookingsAPI = {
  create: (data) => api.post("/bookings", data),
  getMyBookings: () => api.get("/bookings/my-bookings"),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

// Shows API
export const showsAPI = {
  getAll: () => api.get("/shows"),
  getById: (id) => api.get(`/shows/${id}`),
  getByMovie: (movieId, params) =>
    api.get(`/shows/movie/${movieId}`, { params }),
  create: (data) => api.post("/shows", data),
  update: (id, data) => api.put(`/shows/${id}`, data),
  delete: (id) => api.delete(`/shows/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: () => api.get("/admin/users"),
  getBookings: () => api.get("/admin/bookings"),
  getShows: () => api.get("/admin/shows"),
  updateShow: (id, data) => api.put(`/admin/shows/${id}`, data),
  deleteShow: (id) => api.delete(`/admin/shows/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateBookingStatus: (id, data) =>
    api.put(`/admin/bookings/${id}/status`, data),
  deleteBooking: (id) => api.delete(`/admin/bookings/${id}`),
};

// Default export for general API calls
export default api;
