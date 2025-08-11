// import React, { useState, useEffect } from 'react';
// import { Row, Col, Card, Badge, Button, Table, Container } from 'react-bootstrap';
// import { Link } from 'react-router-dom';
// import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaFilm, FaUsers } from 'react-icons/fa';
// import showsService from '../../services/showsService';
// import LoadingSpinner from '../common/LoadingSpinner';
// import '../../styles/admin-shows-table.css';

// const ShowsList = ({ movieId, cityFilter, dateFilter }) => {
//   const [shows, setShows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const selectedDate = dateFilter ? dateFilter.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       fetchShows();
//     }, 300); // Debounce API calls

//     return () => clearTimeout(timeoutId);
//   }, [movieId, selectedDate, cityFilter, dateFilter]);

//   const fetchShows = async () => {
//     try {
//       setLoading(true);
//       console.log('Fetching shows with params:', { movieId, selectedDate, cityFilter });

//       let response;

//       if (movieId) {
//         // Get shows for specific movie with server-side filtering
//         response = await showsService.getShowsByMovie(movieId, {
//           date: selectedDate,
//           city: cityFilter
//         });
//       } else {
//         // Get current shows only
//         response = await showsService.getAll();
//       }

//       console.log('API response:', response.data?.length || 0, 'shows');

//       // Apply filtering
//       let filteredShows = response.data || [];

//       // Filter out past shows
//       filteredShows = filteredShows.filter(show => !isPastShow(show));

//       if (!movieId) {
//         // Filter by selected date
//         if (selectedDate) {
//           filteredShows = filteredShows.filter(show => {
//             const showDate = new Date(show.showDate).toISOString().split('T')[0];
//             return showDate === selectedDate;
//           });
//         }

//         // Filter by city
//         if (cityFilter) {
//           filteredShows = filteredShows.filter(show => {
//             return show.theater &&
//                    (show.theater.city === cityFilter ||
//                     show.theater.location === cityFilter);
//           });
//         }
//       }

//       console.log('Final filtered shows:', filteredShows.length, 'Date:', selectedDate, 'City:', cityFilter);

//       // Group shows by theater
//       const groupedShows = filteredShows.reduce((acc, show) => {
//         if (!show.theater) {
//           console.warn('Show without theater:', show._id);
//           return acc;
//         }

//         const theaterId = show.theater._id;
//         if (!acc[theaterId]) {
//           acc[theaterId] = {
//             theater: show.theater,
//             shows: []
//           };
//         }
//         acc[theaterId].shows.push(show);
//         return acc;
//       }, {});

//       const groupedShowsArray = Object.values(groupedShows);
//       console.log('Theaters with shows:', groupedShowsArray.length);

//       setShows(groupedShowsArray);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching shows:', err);
//       setError('Failed to load shows. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Generate date options for the next 7 days
//   const getDateOptions = () => {
//     const options = [];
//     const today = new Date();

//     for (let i = 0; i < 7; i++) {
//       const date = new Date();
//       date.setDate(today.getDate() + i);

//       const formattedDate = date.toISOString().split('T')[0];
//       const displayDate = i === 0 ? 'Today' :
//                           i === 1 ? 'Tomorrow' :
//                           date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

//       options.push({ value: formattedDate, label: displayDate });
//     }

//     return options;
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

//   if (loading) return <LoadingSpinner />;

//   if (error) {
//     return (
//       <div className="text-center my-5">
//         <p className="text-danger">{error}</p>
//         <Button variant="primary" onClick={fetchShows}>Try Again</Button>
//       </div>
//     );
//   }

//   const hasAnyShows = shows.some(({ shows: theaterShows }) => theaterShows && theaterShows.length > 0);

//   if (!hasAnyShows && !loading) {
//     return (
//       <div className="shows-list">
//         <div className="text-center my-5">
//           <h4 className="text-white">No shows available</h4>
//           <p className="text-secondary">
//             Total shows fetched: {shows.length}
//           </p>
//           <p className="text-secondary">
//             {cityFilter ? `No shows found in ${cityFilter} for this date` : 'No shows available for this date'}
//           </p>
//           <Button variant="primary" onClick={fetchShows}>Refresh Shows</Button>
//         </div>
//       </div>
//     );
//   }

//   // Always show something for debugging
//   if (shows.length === 0 && !loading) {
//     return (
//       <div className="shows-list">
//         <div className="text-center my-5">
//           <h4 className="text-white">Debug: No theaters found</h4>
//           <p className="text-secondary">Check console for API response</p>
//           <Button variant="primary" onClick={fetchShows}>Try Again</Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="admin-shows-container">
//       {/* Header */}
//       <div className="admin-header">
//         <h1 className="admin-title">
//           <FaFilm className="title-icon" />
//           Shows Management
//         </h1>
//         <p className="admin-subtitle">Manage and view all movie shows</p>
//       </div>

//       {/* Shows by theater - Only show theaters that have shows */}
//       {shows
//         .filter(({ shows: theaterShows }) => theaterShows && theaterShows.length > 0)
//         .map(({ theater, shows: theaterShows }) => (
//         <Card key={theater._id} className="admin-table-card mb-4">
//           <div className="theater-header">
//             <div className="theater-info">
//               <div className="theater-main">
//                 <h5 className="theater-name">
//                   <FaMapMarkerAlt className="me-2" />
//                   {theater.name}
//                 </h5>
//                 <p className="theater-location">
//                   {theater.location || theater.city}
//                 </p>
//               </div>
//               <div className="theater-stats">
//                 <Badge bg="primary" className="me-2">
//                   <FaUsers className="me-1" />
//                   {theater.screens?.length || theater.totalScreens || 1} Screens
//                 </Badge>
//                 <Badge bg="success">
//                   {theaterShows.length} Shows
//                 </Badge>
//               </div>
//             </div>
//           </div>

//           {/* Desktop Table View */}
//           <div className="d-none d-lg-block">
//             <Table className="admin-table mb-0">
//               <thead>
//                 <tr>
//                   <th><FaClock className="me-2" />Show Time</th>
//                   <th>Screen</th>
//                   <th><FaFilm className="me-2" />Movie</th>
//                   <th>Price</th>
//                   <th>Available Seats</th>
//                   <th>Status</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {theaterShows
//                   .sort((a, b) => a.showTime.localeCompare(b.showTime))
//                   .map(show => {
//                     const isShowPast = isPastShow(show);
//                     const availableSeats = show.totalSeats - (show.bookedSeats || 0);

//                     return (
//                       <tr key={show._id} className={isShowPast ? 'show-expired' : ''}>
//                         <td>
//                           <div className="show-time">
//                             <FaClock className="me-2" />
//                             <strong>{formatTime(show.showTime)}</strong>
//                           </div>
//                         </td>
//                         <td>
//                           <Badge bg="outline-light" className="screen-badge">
//                             Screen {show.screenNumber}
//                           </Badge>
//                         </td>
//                         <td>
//                           <div className="movie-cell">
//                             <img
//                               src={show.movie?.poster || 'https://via.placeholder.com/35x50/1f2025/fff?text=M'}
//                               alt={show.movie?.title}
//                               className="movie-poster"
//                             />
//                             <div>
//                               <div className="movie-title">{show.movie?.title || 'N/A'}</div>
//                               {show.movie?.genre && (
//                                 <small className="movie-genre">
//                                   {show.movie.genre}
//                                 </small>
//                               )}
//                             </div>
//                           </div>
//                         </td>
//                         <td>
//                           <span className="price-badge">₹{show.price}</span>
//                         </td>
//                         <td>
//                           <div className="seats-info">
//                             <span className={`seats-count ${availableSeats < 10 ? 'low-seats' : ''}`}>
//                               {availableSeats}/{show.totalSeats || 100}
//                             </span>
//                             <small className="d-block text-secondary">Available</small>
//                           </div>
//                         </td>
//                         <td>
//                           <Badge
//                             bg={isShowPast ? 'danger' : availableSeats < 10 ? 'warning' : 'success'}
//                             className="status-badge"
//                           >
//                             {isShowPast ? 'Expired' : availableSeats < 10 ? 'Filling Fast' : 'Available'}
//                           </Badge>
//                         </td>
//                         <td>
//                           <Link
//                             to={isShowPast ? '#' : `/booking/${show._id}`}
//                             className={`btn btn-sm ${isShowPast ? 'btn-outline-secondary disabled' : 'btn-primary'}`}
//                           >
//                             <FaTicketAlt className="me-1" />
//                             {isShowPast ? 'Expired' : 'Book Now'}
//                           </Link>
//                         </td>
//                       </tr>
//                     );
//                   })}
//               </tbody>
//             </Table>
//           </div>

//           {/* Mobile Card View */}
//           <div className="d-lg-none">
//             <div className="mobile-shows-container">
//               {theaterShows
//                 .sort((a, b) => a.showTime.localeCompare(b.showTime))
//                 .map(show => {
//                   const isShowPast = isPastShow(show);
//                   const availableSeats = show.totalSeats - (show.bookedSeats || 0);

//                   return (
//                     <div key={show._id} className={`mobile-show-card ${isShowPast ? 'expired' : ''}`}>
//                       <div className="mobile-show-header">
//                         <div className="time-info">
//                           <FaClock className="me-2" />
//                           <strong>{formatTime(show.showTime)}</strong>
//                         </div>
//                         <Badge
//                           bg={isShowPast ? 'danger' : availableSeats < 10 ? 'warning' : 'success'}
//                           className="status-badge"
//                         >
//                           {isShowPast ? 'Expired' : availableSeats < 10 ? 'Filling Fast' : 'Available'}
//                         </Badge>
//                       </div>

//                       <div className="mobile-details">
//                         <div className="detail-row">
//                           <span className="label">Screen:</span>
//                           <span className="value">Screen {show.screenNumber}</span>
//                         </div>
//                         <div className="detail-row">
//                           <span className="label">Movie:</span>
//                           <span className="value">{show.movie?.title || 'N/A'}</span>
//                         </div>
//                         <div className="detail-row">
//                           <span className="label">Price:</span>
//                           <span className="value price">₹{show.price}</span>
//                         </div>
//                         <div className="detail-row">
//                           <span className="label">Seats:</span>
//                           <span className={`value ${availableSeats < 10 ? 'low-seats' : ''}`}>
//                             {availableSeats}/{show.totalSeats || 100}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="mobile-action">
//                         <Link
//                           to={isShowPast ? '#' : `/booking/${show._id}`}
//                           className={`btn btn-sm w-100 ${isShowPast ? 'btn-outline-secondary disabled' : 'btn-primary'}`}
//                         >
//                           <FaTicketAlt className="me-1" />
//                           {isShowPast ? 'Expired' : 'Book Now'}
//                         </Link>
//                       </div>
//                     </div>
//                   );
//                 })}
//             </div>
//           </div>
//         </Card> 
//       ))}
//     </div>
//   );
// };

// export default ShowsList;
