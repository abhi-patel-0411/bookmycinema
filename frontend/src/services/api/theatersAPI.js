import axios from '../axios';

const theatersAPI = {
  // Basic CRUD
  getAll: (params = {}) => {
    // For simple requests, get all theaters without pagination
    const searchParams = { ...params, limit: 1000 };
    return axios.get('/theaters', { params: searchParams });
  },

  getById: (id) => {
    return axios.get(`/theaters/${id}`);
  },

  create: (theaterData) => {
    return axios.post('/theaters', theaterData);
  },

  update: (id, theaterData) => {
    return axios.put(`/theaters/${id}`, theaterData);
  },

  delete: (id) => {
    return axios.delete(`/theaters/${id}`);
  },

  // Advanced features
  search: (searchParams) => {
    return axios.get('/theaters', { params: searchParams });
  },

  getNearby: (lat, lng, radius = 10) => {
    return axios.get('/theaters/nearby', { 
      params: { lat, lng, radius } 
    });
  },

  getAnalytics: (dateRange = {}) => {
    return axios.get('/theaters/analytics', { params: dateRange });
  },

  bulkUpdate: (theaterIds, updateData) => {
    return axios.patch('/theaters/bulk-update', { theaterIds, updateData });
  },

  // Screen management
  addScreen: (theaterId, screenData) => {
    return axios.post(`/theaters/${theaterId}/screens`, screenData);
  },

  updateScreen: (theaterId, screenId, screenData) => {
    return axios.put(`/theaters/${theaterId}/screens/${screenId}`, screenData);
  },

  deleteScreen: (theaterId, screenId) => {
    return axios.delete(`/theaters/${theaterId}/screens/${screenId}`);
  },

  // Utility methods
  getAllTheaters: function() { return this.getAll(); },
  getTheaterById: function(id) { return this.getById(id); },
  createTheater: function(data) { return this.create(data); },
  updateTheater: function(id, data) { return this.update(id, data); },
  deleteTheater: function(id) { return this.delete(id); }
};

export default theatersAPI;