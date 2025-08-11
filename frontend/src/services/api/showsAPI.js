import api from '../api';

const getAllShows = (currentOnly = false) => {
  return api.get('/shows', { params: { current: currentOnly } });
};

const getCities = () => {
  return api.get('/shows/cities/list');
};

const getShowById = (id) => {
  return api.get(`/shows/${id}`);
};

const getShowsByMovie = (movieId, params = {}) => {
  return api.get(`/shows/movie/${movieId}`, { params });
};

const getShowsByTheater = (theaterId) => {
  return api.get(`/shows/theater/${theaterId}`);
};

const getShowsByDate = (date) => {
  return api.get(`/shows/date/${date}`);
};

const createShow = (showData) => {
  return api.post('/shows', showData);
};

const updateShow = (id, showData) => {
  return api.put(`/shows/${id}`, showData);
};

const deleteShow = (id) => {
  return api.delete(`/shows/${id}`);
};

export default {
  getAllShows,
  getShowById,
  getShowsByMovie,
  getShowsByTheater,
  getShowsByDate,
  createShow,
  updateShow,
  deleteShow,
  getCities
};