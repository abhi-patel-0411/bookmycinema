import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Image } from 'react-bootstrap';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';
import moment from 'moment';
import '../../styles/admin-responsive-tables.css';

const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const AdminMoviesTable = ({ movies, onEdit, onDelete, onView }) => {
  return (
    <>
      {/* Desktop Table */}
      <div className="table-responsive d-none d-lg-block">
        <Table striped bordered hover variant="dark" className="admin-movies-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Poster</th>
              <th>Title</th>
              <th>Genre</th>
              <th>Duration</th>
              <th>Language</th>
              <th>Rating</th>
              <th>Release Date</th>
              <th>Price</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
        <tbody>
          {movies.map((movie, index) => (
            <motion.tr
              key={movie._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <td className="text-center">
                <Image
                  src={movie.poster ? `${API_BASE_URL}${movie.poster}` : `https://via.placeholder.com/60x80/1e293b/ffffff?text=${encodeURIComponent(movie.title.charAt(0))}`}
                  alt={movie.title}
                  className="movie-poster-small"
                  style={{
                    width: '50px',
                    height: '70px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #444'
                  }}
                />
              </td>
              <td>
                <div className="movie-title-cell">
                  <strong>{movie.title}</strong>
                  {movie.director && (
                    <div className="text-muted small">Dir: {movie.director}</div>
                  )}
                </div>
              </td>
              <td>
                {Array.isArray(movie.genre) ? (
                  movie.genre.slice(0, 2).map((g, i) => (
                    <Badge key={i} bg="secondary" className="me-1 mb-1">
                      {g}
                    </Badge>
                  ))
                ) : (
                  <Badge bg="secondary">{movie.genre || 'N/A'}</Badge>
                )}
              </td>
              <td>{movie.duration ? `${movie.duration} min` : 'N/A'}</td>
              <td>{movie.language || 'N/A'}</td>
              <td>
                <Badge bg={movie.rating >= 8 ? 'success' : movie.rating >= 6 ? 'warning' : 'danger'}>
                  ⭐ {movie.rating || 'N/A'}
                </Badge>
              </td>
              <td>
                {movie.releaseDate 
                  ? moment(movie.releaseDate).format('MMM DD, YYYY')
                  : 'N/A'
                }
              </td>
              <td>
                <Badge bg="info">₹{movie.price || '199'}</Badge>
              </td>
              <td>
                <div className="d-flex gap-1">
                  <Button
                    size="sm"
                    variant="outline-info"
                    onClick={() => onView && onView(movie)}
                    title="View Details"
                  >
                    <FaEye />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    onClick={() => onEdit(movie)}
                    title="Edit Movie"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => onDelete(movie._id)}
                    title="Delete Movie"
                  >
                    <FaTrash />
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
          </tbody>
        </Table>
      </div>
      
      {/* Mobile Cards */}
      <div className="d-lg-none">
        {movies.map((movie, index) => (
          <motion.div
            key={movie._id}
            className="card mb-3 admin-mobile-card admin-mobile-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-start mb-3">
                <img
                  src={movie.poster ? `${API_BASE_URL}${movie.poster}` : `https://via.placeholder.com/60x80/1e293b/ffffff?text=${encodeURIComponent(movie.title.charAt(0))}`}
                  alt={movie.title}
                  className="me-3"
                  style={{
                    width: '60px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #444'
                  }}
                />
                <div className="flex-grow-1">
                  <h6 className="text-white mb-1">{movie.title}</h6>
                  {movie.director && (
                    <small className="text-muted d-block mb-2">Dir: {movie.director}</small>
                  )}
                  <div className="mb-2">
                    {Array.isArray(movie.genre) ? (
                      movie.genre.slice(0, 2).map((g, i) => (
                        <Badge key={i} bg="secondary" className="me-1 mb-1" style={{ fontSize: '0.7rem' }}>
                          {g}
                        </Badge>
                      ))
                    ) : (
                      <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>{movie.genre || 'N/A'}</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <small className="text-muted d-block">Duration</small>
                  <span className="text-white">{movie.duration ? `${movie.duration} min` : 'N/A'}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Language</small>
                  <span className="text-white">{movie.language || 'N/A'}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Rating</small>
                  <Badge bg={movie.rating >= 8 ? 'success' : movie.rating >= 6 ? 'warning' : 'danger'}>
                    ⭐ {movie.rating || 'N/A'}
                  </Badge>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Price</small>
                  <Badge bg="info">₹{movie.price || '199'}</Badge>
                </div>
              </div>
              
              <div className="mb-2">
                <small className="text-muted d-block">Release Date</small>
                <span className="text-white">
                  {movie.releaseDate 
                    ? moment(movie.releaseDate).format('MMM DD, YYYY')
                    : 'N/A'
                  }
                </span>
              </div>
              
              <div className="d-flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline-info"
                  onClick={() => onView && onView(movie)}
                  className="flex-fill"
                >
                  <FaEye className="me-1" /> View
                </Button>
                <Button
                  size="sm"
                  variant="outline-warning"
                  onClick={() => onEdit(movie)}
                  className="flex-fill"
                >
                  <FaEdit className="me-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onDelete(movie._id)}
                  className="flex-fill"
                >
                  <FaTrash className="me-1" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
};

export default AdminMoviesTable;