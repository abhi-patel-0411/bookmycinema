import axios from '../axios';

const getAllMovies = (showExpired = false, isAdmin = false) => {
  let queryParams = [];
  if (showExpired) queryParams.push('showExpired=true');
  if (isAdmin) queryParams.push('isAdmin=true');
  
  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  return axios.get(`/movies${queryString}`);
};

const getMovieById = (id) => {
  return axios.get(`/movies/${id}`);
};

const createMovie = (movieData) => {
  const formData = new FormData();
  
  Object.keys(movieData).forEach(key => {
    if (key === 'poster' && movieData[key] instanceof File) {
      formData.append('poster', movieData[key]);
    } else {
      formData.append(key, movieData[key]);
    }
  });
  
  return axios.post('/movies', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

const updateMovie = (id, movieData) => {
  const formData = new FormData();
  
  Object.keys(movieData).forEach(key => {
    if (key === 'poster' && movieData[key] instanceof File) {
      formData.append('poster', movieData[key]);
    } else {
      formData.append(key, movieData[key]);
    }
  });
  
  return axios.put(`/movies/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

const deleteMovie = (id) => {
  return axios.delete(`/movies/${id}`);
};

export default {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};