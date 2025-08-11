import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaBuilding, FaFilm, FaEdit, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import showsService from '../../services/showsService';
import '../../styles/admin-shows-clean.css';

const AdminShowsClean = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    movie: '',
    theater: '',
    date: '',
    time: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalShows: 0
  });

  useEffect(() => {
    fetchShows();
  }, [filters, pagination.currentPage]);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/shows?includeBookingClosed=true&page=${pagination.currentPage}&limit=10${filters.search ? `&search=${filters.search}` : ''}${filters.date ? `&date=${filters.date}` : ''}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const showsData = Array.isArray(data) ? data : data.shows || data.data || [];
      
      // Transform data for display
      const transformedShows = showsData.map(show => ({
        id: show._id,
        movie: {
          title: show.movie?.title || 'N/A',
          poster: show.movie?.poster || 'https://via.placeholder.com/40x60/1f2937/9ca3af?text=Movie',
          genre: show.movie?.genre || 'Unknown'
        },
        theater: {
          name: show.theater?.name || 'N/A',
          location: show.theater?.location || show.theater?.city || 'N/A'
        },
        date: show.showDate,
        time: show.showTime,
        price: show.price || 0,
        status: getShowStatus(show),
        screenNumber: show.screenNumber || 1
      }));
      
      setShows(transformedShows);
      setPagination(prev => ({
        ...prev,
        totalShows: transformedShows.length,
        totalPages: Math.ceil(transformedShows.length / 10)
      }));
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShowStatus = (show) => {
    const now = new Date();
    const showDateTime = new Date(show.showDate);
    const [hours, minutes] = show.showTime.split(':');
    showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    
    if (now > showDateTime) {
      return { type: 'expired', label: 'Expired' };
    } else if (now > new Date(showDateTime.getTime() - 15 * 60 * 1000)) {
      return { type: 'active', label: 'Active' };
    } else {
      return { type: 'upcoming', label: 'Upcoming' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      movie: '',
      theater: '',
      date: '',
      time: ''
    });
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleEdit = (showId) => {
    console.log('Edit show:', showId);
  };

  const handleDelete = (showId) => {
    console.log('Delete show:', showId);
  };

  const renderPagination = () => {
    const pages = [];
    const { currentPage, totalPages } = pagination;
    
    // Previous button
    pages.push(
      <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button 
          className="page-link"
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </button>
      </li>
    );
    
    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button 
            className="page-link"
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      );
    }
    
    // Next button
    pages.push(
      <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button 
          className="page-link"
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ›
        </button>
      </li>
    );
    
    return pages;
  };

  return (
    <div className="admin-shows-page">
      <div className="admin-shows-container">
        {/* Header */}
        <div className="admin-shows-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="admin-shows-title">
                <FaFilm />
                Shows Management
              </h1>
              <p className="admin-shows-subtitle">Manage movie shows and schedules</p>
            </div>
            <button 
              className="admin-clear-btn"
              style={{ 
                background: '#3b82f6', 
                borderColor: '#3b82f6', 
                color: 'white',
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaPlus size={14} />
              Add New Show
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters-card">
          <div className="admin-filters-row">
            <div className="admin-filter-group">
              <label className="admin-filter-label">Search</label>
              <div style={{ position: 'relative' }}>
                <FaSearch 
                  style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    fontSize: '14px'
                  }} 
                />
                <input
                  type="text"
                  className="admin-filter-input"
                  placeholder="Search shows..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            
            <div className="admin-filter-group">
              <label className="admin-filter-label">Movie</label>
              <select
                className="admin-filter-select"
                value={filters.movie}
                onChange={(e) => handleFilterChange('movie', e.target.value)}
              >
                <option value="">All Movies</option>
                <option value="movie1">The Batman</option>
                <option value="movie2">Spider-Man</option>
                <option value="movie3">Avengers</option>
              </select>
            </div>
            
            <div className="admin-filter-group">
              <label className="admin-filter-label">Theater</label>
              <select
                className="admin-filter-select"
                value={filters.theater}
                onChange={(e) => handleFilterChange('theater', e.target.value)}
              >
                <option value="">All Theaters</option>
                <option value="theater1">CinePlex Grand</option>
                <option value="theater2">Metro Cinema</option>
                <option value="theater3">Star Multiplex</option>
              </select>
            </div>
            
            <div className="admin-filter-group">
              <label className="admin-filter-label">Date</label>
              <input
                type="date"
                className="admin-filter-input"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
            </div>
            
            <div className="admin-filter-group">
              <label className="admin-filter-label">Time</label>
              <input
                type="time"
                className="admin-filter-input"
                value={filters.time}
                onChange={(e) => handleFilterChange('time', e.target.value)}
              />
            </div>
            
            <button className="admin-clear-btn" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-card">
          <table className="admin-shows-table">
            <thead>
              <tr>
                <th><FaFilm />Movie</th>
                <th><FaBuilding />Theater</th>
                <th><FaCalendarAlt />Date</th>
                <th><FaClock />Time</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    Loading shows...
                  </td>
                </tr>
              ) : shows.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No shows found
                  </td>
                </tr>
              ) : (
                shows.map((show) => (
                  <tr key={show.id}>
                    <td>
                      <div className="admin-movie-cell">
                        <img 
                          src={show.movie.poster} 
                          alt={show.movie.title}
                          className="admin-movie-poster"
                        />
                        <div className="admin-movie-info">
                          <div className="admin-movie-title">{show.movie.title}</div>
                          <div className="admin-movie-genre">{show.movie.genre}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-theater-cell">
                        <div className="admin-theater-name">{show.theater.name}</div>
                        <div className="admin-theater-location">{show.theater.location}</div>
                      </div>
                    </td>
                    <td className="admin-date-cell">{formatDate(show.date)}</td>
                    <td className="admin-time-cell">{formatTime(show.time)}</td>
                    <td>
                      <span className="admin-price-badge">₹{show.price}</span>
                    </td>
                    <td>
                      <span className={`admin-status-badge admin-status-${show.status.type}`}>
                        {show.status.label}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-buttons">
                        <button 
                          className="admin-action-btn admin-action-btn-edit"
                          onClick={() => handleEdit(show.id)}
                          title="Edit Show"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="admin-action-btn admin-action-btn-delete"
                          onClick={() => handleDelete(show.id)}
                          title="Delete Show"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          {!loading && shows.length > 0 && (
            <div className="admin-pagination-container">
              <ul className="admin-pagination">
                {renderPagination()}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminShowsClean;