// import React, { useState, useEffect } from 'react';
// import { Badge } from 'react-bootstrap';
// import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaFilm, FaUsers } from 'react-icons/fa';
// import { useNavigate } from 'react-router-dom';
// import showsService from '../../services/showsService';
// import AdminTable from '../admin/AdminTable';
// import '../../styles/admin-table.css';

// const ShowsListNew = ({ movieId, cityFilter, dateFilter }) => {
//   const [shows, setShows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [pagination, setPagination] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigate = useNavigate();
  
//   const selectedDate = dateFilter ? dateFilter.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       fetchShows();
//     }, 300);
    
//     return () => clearTimeout(timeoutId);
//   }, [movieId, selectedDate, cityFilter, dateFilter, currentPage, searchTerm]);
  
//   const fetchShows = async () => {
//     try {
//       setLoading(true);
      
//       let response;
      
//       if (movieId) {
//         response = await showsService.getShowsByMovie(movieId, {
//           date: selectedDate,
//           city: cityFilter,
//           page: currentPage,
//           limit: 10,
//           search: searchTerm
//         });
//       } else {
//         response = await showsService.getAll({
//           page: currentPage,
//           limit: 10,
//           search: searchTerm
//         });
//       }
      
//       let filteredShows = response.data || [];
      
//       // Filter out past shows
//       filteredShows = filteredShows.filter(show => !isPastShow(show));
      
//       if (!movieId) {
//         if (selectedDate) {
//           filteredShows = filteredShows.filter(show => {
//             const showDate = new Date(show.showDate).toISOString().split('T')[0];
//             return showDate === selectedDate;
//           });
//         }
        
//         if (cityFilter) {
//           filteredShows = filteredShows.filter(show => {
//             return show.theater && 
//                    (show.theater.city === cityFilter || 
//                     show.theater.location === cityFilter);
//           });
//         }
//       }
      
//       // Flatten shows for table display
//       const allShows = filteredShows.map(show => ({
//         ...show,
//         theaterName: show.theater?.name || 'N/A',
//         theaterLocation: show.theater?.location || show.theater?.city || 'N/A'
//       }));
      
//       setShows(allShows);
//       setPagination({
//         currentPage,
//         totalPages: Math.ceil(allShows.length / 10),
//         totalShows: allShows.length,
//         hasNext: currentPage < Math.ceil(allShows.length / 10),
//         hasPrev: currentPage > 1
//       });
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching shows:', err);
//       setError('Failed to load shows. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const formatTime = (time) => {
//     return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
//       hour: 'numeric',
//       minute: '2-digit',
//       hour12: true
//     });
//   };
  
//   const isPastShow = (show) => {
//     if (!show) return false;
    
//     const now = new Date();
//     const showDateTime = new Date(show.showDate);
//     const [hours, minutes] = show.showTime.split(':');
//     showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    
//     return now > showDateTime;
//   };

//   const columns = [
//     {
//       header: 'Movie',
//       accessor: 'movie.title',
//       icon: FaFilm,
//       render: (value, item) => (
//         <div className="movie-cell">
//           <img 
//             src={item.movie?.poster || 'https://via.placeholder.com/50x75/333/fff?text=Movie'} 
//             alt={item.movie?.title}
//             className="movie-poster"
//           />
//           <div className="movie-details">
//             <div className="movie-title">{item.movie?.title || 'N/A'}</div>
//             <small className="movie-genre">{item.movie?.genre || 'Unknown'}</small>
//           </div>
//         </div>
//       )
//     },
//     {
//       header: 'Theater',
//       accessor: 'theater.name',
//       icon: FaMapMarkerAlt,
//       render: (value, item) => (
//         <div className="theater-cell">
//           <div className="theater-name">{item.theater?.name || 'N/A'}</div>
//           <small className="theater-location">{item.theater?.location || item.theater?.city}</small>
//         </div>
//       )
//     },
//     {
//       header: 'Date',
//       accessor: 'showDate',
//       icon: FaCalendarAlt,
//       render: (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
//     },
//     {
//       header: 'Time',
//       accessor: 'showTime',
//       icon: FaClock,
//       render: (value) => formatTime(value)
//     },
//     {
//       header: 'Screen',
//       accessor: 'screenNumber',
//       render: (value) => `Screen ${value || 1}`
//     },
//     {
//       header: 'Price',
//       accessor: 'price',
//       render: (value) => <span className="price-badge">₹{value}</span>
//     },
//     {
//       header: 'Seats',
//       accessor: 'availableSeats',
//       render: (value, item) => {
//         const availableSeats = (item.totalSeats || 100) - (item.bookedSeats?.length || 0);
//         return (
//           <div className="seats-info">
//             <span className={`seats-count ${availableSeats < 10 ? 'low-seats' : ''}`}>
//               {availableSeats}/{item.totalSeats || 100}
//             </span>
//           </div>
//         );
//       }
//     },
//     {
//       header: 'Status',
//       accessor: 'status',
//       render: (value, item) => {
//         const isShowPast = isPastShow(item);
//         const availableSeats = (item.totalSeats || 100) - (item.bookedSeats?.length || 0);
//         return (
//           <Badge 
//             bg={isShowPast ? 'danger' : availableSeats < 10 ? 'warning' : 'success'}
//             className="status-badge"
//           >
//             {isShowPast ? 'Expired' : availableSeats < 10 ? 'Filling Fast' : 'Available'}
//           </Badge>
//         );
//       }
//     }
//   ];

//   const handleView = (show) => {
//     navigate(`/booking/${show._id}`);
//   };

//   const handleEdit = (show) => {
//     console.log('Edit show:', show._id);
//   };

//   const handleDelete = (show) => {
//     console.log('Delete show:', show._id);
//   };

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handleSearch = (term) => {
//     setSearchTerm(term);
//     setCurrentPage(1);
//   };

//   if (error) {
//     return (
//       <div className="text-center my-5">
//         <p className="text-danger">{error}</p>
//         <button className="btn btn-primary" onClick={fetchShows}>Try Again</button>
//       </div>
//     );
//   }

//   return (
//     <AdminTable
//       data={shows}
//       columns={columns}
//       title="Shows Management"
//       loading={loading}
//       pagination={pagination}
//       onView={handleView}
//       onEdit={handleEdit}
//       onDelete={handleDelete}
//       onPageChange={handlePageChange}
//       onSearch={handleSearch}
//       searchable={true}
//     />
//   );
// };

// export default ShowsListNew;