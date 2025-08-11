import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import moment from 'moment';

const AdminBookingsTable = ({ bookings, onEdit, onDelete, onStatusUpdate }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'success', text: 'Confirmed', icon: <FaCheck className="me-1" /> },
      cancelled: { bg: 'danger', text: 'Cancelled', icon: <FaTimes className="me-1" /> },
      pending: { bg: 'warning', text: 'Pending', icon: <FaClock className="me-1" /> },
      completed: { bg: 'info', text: 'Completed', icon: <FaCheck className="me-1" /> }
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status, icon: null };
    
    return (
      <Badge bg={config.bg} className="status-badge">
        {config.icon} {config.text}
      </Badge>
    );
  };

  const isMobile = window.innerWidth < 768;
  
  return (
    <div className="table-responsive" style={{ overflowX: 'auto' }}>
      <Table hover variant="dark" className="bookings-table mb-0" style={{ borderRadius: '20px', overflow: 'hidden', minWidth: isMobile ? '600px' : '800px' }}>
        <thead>
          <tr>
            <th style={{ width: isMobile ? '60px' : '80px', fontSize: isMobile ? '0.8rem' : '1rem' }}>#</th>
            <th style={{ minWidth: isMobile ? '140px' : '180px', fontSize: isMobile ? '0.8rem' : '1rem' }}>Customer</th>
            <th style={{ minWidth: isMobile ? '160px' : '200px', fontSize: isMobile ? '0.8rem' : '1rem' }}>Movie</th>
            <th style={{ minWidth: isMobile ? '100px' : '140px', fontSize: isMobile ? '0.8rem' : '1rem' }} className={isMobile ? 'd-none d-md-table-cell' : ''}>Date</th>
            <th style={{ minWidth: isMobile ? '80px' : '120px', fontSize: isMobile ? '0.8rem' : '1rem' }}>Seats</th>
            <th style={{ minWidth: isMobile ? '80px' : '100px', fontSize: isMobile ? '0.8rem' : '1rem' }}>Amount</th>
            <th style={{ minWidth: isMobile ? '80px' : '100px', fontSize: isMobile ? '0.8rem' : '1rem' }}>Status</th>
            <th className="text-center" style={{ minWidth: isMobile ? '80px' : '120px', fontSize: isMobile ? '0.8rem' : '1rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, index) => (
            <motion.tr 
              key={booking._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <td className="align-middle" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                <span className="fw-bold">{booking.bookingId?.slice(-5) || index + 1}</span>
              </td>
              <td className="align-middle">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2" 
                    style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                    <span className="text-white fw-bold" style={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}>
                      {(booking.customerName || booking.user?.name || 'G').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="fw-bold text-white" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                      {isMobile ? (booking.customerName || booking.user?.name || 'Guest').split(' ')[0] : (booking.customerName || booking.user?.name || 'Guest')}
                    </div>
                    {!isMobile && <div className="small text-secondary">{booking.customerEmail || booking.user?.email || 'N/A'}</div>}
                  </div>
                </div>
              </td>
              <td className="align-middle">
                <div className="d-flex align-items-center">
                  <img
                    src={
                      booking.moviePoster ||
                      booking.show?.movie?.poster ||
                      '/bookmyshow.png'
                    }
                    alt={booking.movieTitle || booking.show?.movie?.title}
                    className="rounded me-2"
                    style={{ width: isMobile ? '24px' : '30px', height: isMobile ? '32px' : '40px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/bookmyshow.png';
                    }}
                  />
                  <div>
                    <div className="fw-bold text-white" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                      {isMobile ? 
                        (booking.movieTitle || booking.show?.movie?.title || 'N/A').substring(0, 15) + '...' :
                        (booking.movieTitle || booking.show?.movie?.title || 'N/A')
                      }
                      {(booking.show?.movie?.isActive === false || !booking.show?.movie) && (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.6rem', verticalAlign: 'middle' }}>Inactive</span>
                      )}
                    </div>
                    <div className="small text-secondary" style={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                      {isMobile ? 
                        (booking.theaterName || booking.show?.theater?.name || 'N/A').substring(0, 12) + '...' :
                        (booking.theaterName || booking.show?.theater?.name || 'N/A')
                      }
                    </div>
                    {isMobile && (
                      <div className="small text-secondary" style={{ fontSize: '0.65rem' }}>
                        {booking.show?.showDate ? moment(booking.show.showDate).format('MMM DD') : 
                         booking.showDate ? moment(booking.showDate).format('MMM DD') : 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="align-middle d-none d-md-table-cell">
                <div className="fw-bold text-white" style={{ fontSize: '0.875rem' }}>
                  {booking.show?.showDate ? moment(booking.show.showDate).format('MMM DD, YYYY') : 
                   booking.showDate ? moment(booking.showDate).format('MMM DD, YYYY') : 'N/A'}
                </div>
                <div className="small text-secondary">{booking.show?.showTime || booking.showTime || 'N/A'}</div>
              </td>
              <td className="align-middle">
                <div className="d-flex flex-wrap gap-1">
                  {booking.seats?.slice(0, isMobile ? 2 : 3).map((seat, i) => (
                    <motion.span 
                      key={i} 
                      className="badge bg-primary"
                      style={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {seat}
                    </motion.span>
                  ))}
                  {booking.seats?.length > (isMobile ? 2 : 3) && (
                    <span className="badge bg-secondary" style={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>+{booking.seats.length - (isMobile ? 2 : 3)}</span>
                  )}
                </div>
              </td>
              <td className="align-middle">
                <div className="fw-bold text-success" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>₹{booking.totalAmount || 0}</div>
                {!isMobile && (
                  <div className="small text-secondary">
                    {booking.seats?.length ? `₹${Math.round((booking.totalAmount || 0) / booking.seats.length)}/seat` : ''}
                  </div>
                )}
              </td>
              <td className="align-middle">
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}>
                  {getStatusBadge(booking.status)}
                </div>
              </td>
              <td className="align-middle text-center">
                <div className="d-flex justify-content-center gap-1">
                  <motion.button
                    className="btn btn-sm btn-outline-primary action-button"
                    style={{ padding: isMobile ? '0.2rem 0.4rem' : '0.375rem 0.75rem', fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                    onClick={() => onEdit(booking)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaEdit size={isMobile ? 10 : 12} />
                  </motion.button>
                  <motion.button
                    className="btn btn-sm btn-outline-danger action-button"
                    style={{ padding: isMobile ? '0.2rem 0.4rem' : '0.375rem 0.75rem', fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                    onClick={() => onDelete(booking._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTrash size={isMobile ? 10 : 12} />
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminBookingsTable;