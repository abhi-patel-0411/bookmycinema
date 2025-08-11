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

  return (
    <div className="table-responsive">
      <Table hover variant="dark" className="bookings-table mb-0" style={{ borderRadius: '20px', overflow: 'hidden', minWidth: '800px' }}>
        <thead>
          <tr>
            <th style={{ width: '80px' }}>#</th>
            <th style={{ minWidth: '180px' }}>Customer</th>
            <th style={{ minWidth: '200px' }}>Movie & Theater</th>
            <th style={{ minWidth: '140px' }}>Date & Time</th>
            <th style={{ minWidth: '120px' }}>Seats</th>
            <th style={{ minWidth: '100px' }}>Amount</th>
            <th style={{ minWidth: '100px' }}>Status</th>
            <th className="text-center" style={{ minWidth: '120px' }}>Actions</th>
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
              <td className="align-middle">
                <span className="fw-bold">{booking.bookingId?.slice(-5) || index + 1}</span>
              </td>
              <td className="align-middle">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2" 
                    style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                    <span className="text-white fw-bold">
                      {(booking.customerName || booking.user?.name || 'G').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="fw-bold text-white">{booking.customerName || booking.user?.name || 'Guest'}</div>
                    <div className="small text-secondary">{booking.customerEmail || booking.user?.email || 'N/A'}</div>
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
                    style={{ width: '30px', height: '40px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/bookmyshow.png';
                    }}
                  />
                  <div>
                    <div className="fw-bold text-white">
                      {booking.movieTitle || booking.show?.movie?.title || 'N/A'}
                      {(booking.show?.movie?.isActive === false || !booking.show?.movie) && (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>Inactive</span>
                      )}
                    </div>
                    <div className="small text-secondary">{booking.theaterName || booking.show?.theater?.name || 'N/A'}</div>
                  </div>
                </div>
              </td>
              <td className="align-middle">
                <div className="fw-bold text-white">
                  {booking.show?.showDate ? moment(booking.show.showDate).format('MMM DD, YYYY') : 
                   booking.showDate ? moment(booking.showDate).format('MMM DD, YYYY') : 'N/A'}
                </div>
                <div className="small text-secondary">{booking.show?.showTime || booking.showTime || 'N/A'}</div>
              </td>
              <td className="align-middle">
                <div className="d-flex flex-wrap gap-1">
                  {booking.seats?.slice(0, 3).map((seat, i) => (
                    <motion.span 
                      key={i} 
                      className="badge bg-primary"
                      whileHover={{ scale: 1.1 }}
                    >
                      {seat}
                    </motion.span>
                  ))}
                  {booking.seats?.length > 3 && (
                    <span className="badge bg-secondary">+{booking.seats.length - 3}</span>
                  )}
                </div>
              </td>
              <td className="align-middle">
                <div className="fw-bold text-success">₹{booking.totalAmount || 0}</div>
                <div className="small text-secondary">
                  {booking.seats?.length ? `₹${Math.round((booking.totalAmount || 0) / booking.seats.length)}/seat` : ''}
                </div>
              </td>
              <td className="align-middle">
                {getStatusBadge(booking.status)}
              </td>
              <td className="align-middle text-center">
                <div className="d-flex justify-content-center gap-2">
                  <motion.button
                    className="btn btn-sm btn-outline-primary action-button"
                    onClick={() => onEdit(booking)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaEdit />
                  </motion.button>
                  <motion.button
                    className="btn btn-sm btn-outline-danger action-button"
                    onClick={() => onDelete(booking._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTrash />
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