import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Badge,
  InputGroup,
  Table,
  Dropdown,
  ProgressBar,
} from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaTicketAlt,
  FaFilter,
  FaChartLine,
  FaMoneyBillWave,
  FaUsers,
  FaCheckCircle,
  FaDownload,
  FaSyncAlt,
  FaSortAmountDown,
  FaSortAmountUp,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaPrint,
  FaFilePdf,
  FaFileExcel,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaBuilding,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import ModernLoader from "../../components/common/ModernLoader";
import AdminBookingsTable from "../../components/admin/AdminBookingsTable";
// Removed BookingCard import as it's no longer needed
import "../../styles/admin-bookings.css";


import moment from "moment";

const AdminBookings = () => {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // Table-only layout
  const [dateFilter, setDateFilter] = useState("");
  const [theaterFilter, setTheaterFilter] = useState("");
  const [sortBy, setSortBy] = useState("bookingDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [refreshing, setRefreshing] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    fetchBookings();
    fetchTheaters();

    const handleBookingUpdate = () => {
      fetchBookings();
    };

    window.addEventListener("admin-bookings-updated", handleBookingUpdate);

    return () => {
      window.removeEventListener("admin-bookings-updated", handleBookingUpdate);
    };
  }, []);
  
  const fetchTheaters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/theaters');
      if (response.ok) {
        const data = await response.json();
        const theatersData = Array.isArray(data) ? data : data.theaters || [];
        setTheaters(theatersData);
      }
    } catch (error) {
      console.error('Error fetching theaters:', error);
    }
  };

  const fetchBookings = async (page = 1, showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFilter && { date: dateFilter }),
        ...(theaterFilter && { theater: theaterFilter }),
      });

      const response = await fetch(
        `http://localhost:5000/api/bookings?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Bookings API Response:", data);

      const bookingsArray = data.bookings || data || [];
      setBookings(bookingsArray);

      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination({
          currentPage: page,
          totalPages: Math.ceil(bookingsArray.length / 20),
          totalBookings: bookingsArray.length,
          hasNext: false,
          hasPrev: page > 1,
        });
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
      toast.error("Failed to fetch bookings");
      setBookings([]);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success("Booking status updated successfully!");
        fetchBookings(pagination.currentPage);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update booking status");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this booking? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/bookings/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          toast.success("Booking deleted successfully!");
          fetchBookings(pagination.currentPage);
        } else {
          throw new Error("Failed to delete booking");
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete booking");
      }
    }
  };

  const handleEdit = (booking) => {
    // Show booking details in modal for editing
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const getBookingStats = () => {
    const allBookings = Array.isArray(bookings) ? bookings : [];
    const totalRevenue = allBookings.reduce(
      (sum, booking) => sum + (booking.totalAmount || 0),
      0
    );
    const confirmedBookings = allBookings.filter(
      (b) => b.status === "confirmed"
    ).length;
    const pendingBookings = allBookings.filter(
      (b) => b.status === "pending"
    ).length;
    const cancelledBookings = allBookings.filter(
      (b) => b.status === "cancelled"
    ).length;
    const completedBookings = allBookings.filter(
      (b) => b.status === "completed"
    ).length;
    const todayBookings = allBookings.filter((b) =>
      moment(b.bookingDate).isSame(moment(), "day")
    ).length;
    const avgBookingValue =
      allBookings.length > 0
        ? Math.round(totalRevenue / allBookings.length)
        : 0;
        
    // Calculate refunds (cancelled bookings amount)
    const refundAmount = allBookings
      .filter(b => b.status === "cancelled")
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    // Calculate theater-specific stats if theater filter is applied
    let theaterStats = null;
    if (theaterFilter) {
      const theaterName = theaters.find(t => t._id === theaterFilter)?.name || 'Selected Theater';
      
      // Include all bookings for this theater, regardless of movie active status
      const theaterBookings = allBookings.filter(b => {
        // Check both the theater ID and the stored theater name for fallback
        return b.show?.theater?._id === theaterFilter || 
               b.theaterName === theaterName;
      });
      
      // Calculate total revenue from all bookings
      const theaterRevenue = theaterBookings.reduce(
        (sum, booking) => sum + (booking.totalAmount || 0),
        0
      );
      
      // Calculate refunds
      const theaterRefunds = theaterBookings
        .filter(b => b.status === "cancelled")
        .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      
      // Calculate active and inactive movie revenues separately
      const activeMovieBookings = theaterBookings.filter(b => 
        b.show?.movie?.isActive !== false // Include undefined/null (assume active)
      );
      
      const inactiveMovieBookings = theaterBookings.filter(b => 
        b.show?.movie?.isActive === false
      );
      
      const activeRevenue = activeMovieBookings.reduce(
        (sum, booking) => sum + (booking.totalAmount || 0),
        0
      );
      
      const inactiveRevenue = inactiveMovieBookings.reduce(
        (sum, booking) => sum + (booking.totalAmount || 0),
        0
      );
      
      theaterStats = {
        name: theaterName,
        bookings: theaterBookings.length,
        revenue: theaterRevenue,
        refunds: theaterRefunds,
        netRevenue: theaterRevenue - theaterRefunds,
        activeRevenue: activeRevenue,
        inactiveRevenue: inactiveRevenue
      };
    }

    console.log("Booking Stats:", {
      total: allBookings.length,
      revenue: totalRevenue,
      confirmed: confirmedBookings,
      pending: pendingBookings,
      cancelled: cancelledBookings,
      today: todayBookings,
      refunds: refundAmount,
      theaterStats: theaterStats
    });

    return {
      total: pagination.totalBookings || allBookings.length,
      revenue: totalRevenue,
      confirmed: confirmedBookings,
      pending: pendingBookings,
      cancelled: cancelledBookings,
      completed: completedBookings,
      today: todayBookings,
      avgValue: avgBookingValue,
      refunds: refundAmount,
      netRevenue: totalRevenue - refundAmount,
      theaterStats: theaterStats
    };
  };

  // Edit function now handles showing the modal

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: "success", text: "Confirmed" },
      cancelled: { bg: "danger", text: "Cancelled" },
      pending: { bg: "warning", text: "Pending" },
      completed: { bg: "info", text: "Completed" },
    };
    const config = statusConfig[status] || { bg: "secondary", text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  // Use bookings directly since filtering is done server-side
  const filteredBookings = Array.isArray(bookings) ? bookings : [];

  const stats = getBookingStats();

  // Auto-refresh bookings every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchBookings(pagination.currentPage, false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, refreshing, pagination.currentPage]);

  // Fetch bookings when filters change (reset to page 1)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBookings(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, dateFilter, theaterFilter, sortBy, sortOrder]);

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchBookings(pagination.currentPage, true);
  };

  // Export functions
  const exportToCSV = () => {
    const csvData = filteredBookings.map((booking) => ({
      "Booking ID": booking.bookingId,
      Customer: booking.customerName || booking.user?.name || "Guest",
      Email: booking.customerEmail || booking.user?.email || "N/A",
      Movie: booking.show?.movie?.title || "N/A",
      Theater: booking.show?.theater?.name || "N/A",
      "Show Date": booking.show?.showDate
        ? moment(booking.show.showDate).format("YYYY-MM-DD")
        : "N/A",
      "Show Time": booking.show?.showTime || "N/A",
      Seats: booking.seats?.join(", ") || "N/A",
      Amount: booking.totalAmount || 0,
      Status: booking.status,
      "Booking Date": moment(booking.bookingDate).format("YYYY-MM-DD HH:mm"),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${moment().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFilter("");
    setTheaterFilter("");
    setSortBy("bookingDate");
    setSortOrder("desc");
  };

  if (loading) return <ModernLoader text="Loading Bookings" />;

  return (
    <AdminLayout>
      <div style={{ background: "#1f2025", minHeight: "100vh", color: "#fff" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap">
            <div className="mb-3 mb-md-0">
              <h1 className="text-white mb-2">Booking Management</h1>
              <p className="text-light mb-0">
                Manage customer bookings and reservations
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant="outline-info"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh Data"
              >
                <FaSyncAlt className={refreshing ? "fa-spin" : ""} />
                <span className="d-none d-sm-inline ms-1">Refresh</span>
              </Button>
              <Dropdown>
                <Dropdown.Toggle variant="outline-success" size="sm">
                  <FaDownload />
                  <span className="d-none d-sm-inline ms-1">Export</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={exportToCSV}>
                    <FaFileExcel className="me-2" />
                    Export CSV
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => window.print()}>
                    <FaPrint className="me-2" />
                    Print
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          {/* Enhanced Stats Cards - All in one row with border-bottom */}
          <div className="booking-stats-container mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <div className="stat-card p-3" style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '4px'
                }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-secondary small">Total Bookings</span>
                    <FaTicketAlt className="text-primary" size={16} />
                  </div>
                  <h3 className="text-white mb-0">{stats.total}</h3>
                  <div className="text-success mt-1" style={{ fontSize: "0.75rem" }}>
                    +{stats.today} today
                  </div>
                </div>
              </div>
              
              <div className="col-6 col-md-3">
                <div className="stat-card p-3" style={{ 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  borderLeft: '4px solid #10b981',
                  borderRadius: '4px'
                }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-secondary small">Total Revenue</span>
                    <FaMoneyBillWave className="text-success" size={16} />
                  </div>
                  <h3 className="text-success mb-0">₹{stats.revenue.toLocaleString()}</h3>
                  <div className="d-flex justify-content-between mt-1" style={{ fontSize: "0.75rem" }}>
                    <span className="text-light">₹{Math.round(stats.avgValue)} avg</span>
                    <span className="text-danger">-₹{stats.refunds.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="col-6 col-md-3">
                <div className="stat-card p-3" style={{ 
                  background: 'rgba(6, 182, 212, 0.1)', 
                  borderLeft: '4px solid #06b6d4',
                  borderRadius: '4px'
                }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-secondary small">Confirmed</span>
                    <FaCheckCircle className="text-info" size={16} />
                  </div>
                  <h3 className="text-white mb-0">{stats.confirmed}</h3>
                  <div className="mt-2" style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ 
                      width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%`,
                      height: '100%',
                      background: '#10b981',
                      borderRadius: '2px'
                    }}></div>
                  </div>
                </div>
              </div>
              
              <div className="col-6 col-md-3">
                <div className="stat-card p-3" style={{ 
                  background: 'rgba(245, 158, 11, 0.1)', 
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: '4px'
                }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-secondary small">Pending</span>
                    <FaClock className="text-warning" size={16} />
                  </div>
                  <h3 className="text-white mb-0">{stats.pending}</h3>
                  <div className="mt-2" style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ 
                      width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`,
                      height: '100%',
                      background: '#f59e0b',
                      borderRadius: '2px'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Theater-specific stats - Professional Version */}
          {stats.theaterStats && (
            <div className="theater-stats-container mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="d-flex align-items-center mb-3">
                <div className="theater-icon-container me-3" style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaMapMarkerAlt className="text-white" size={18} />
                </div>
                <div>
                  <h4 className="text-white mb-0">{stats.theaterStats.name}</h4>
                  <p className="text-secondary mb-0 small">Performance Metrics</p>
                </div>
              </div>
              
              <div className="theater-metrics-grid">
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <div className="metric-card p-3" style={{ 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      borderLeft: '4px solid #3b82f6',
                      borderRadius: '4px'
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="text-secondary small">Total Bookings</span>
                        <FaTicketAlt className="text-primary" size={14} />
                      </div>
                      <h3 className="text-white mb-0">{stats.theaterStats.bookings}</h3>
                    </div>
                  </div>
                  
                  <div className="col-6 col-md-3">
                    <div className="metric-card p-3" style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      borderLeft: '4px solid #10b981',
                      borderRadius: '4px'
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="text-secondary small">Total Revenue</span>
                        <FaMoneyBillWave className="text-success" size={14} />
                      </div>
                      <h3 className="text-success mb-0">₹{stats.theaterStats.revenue.toLocaleString()}</h3>
                      <div className="d-flex justify-content-between mt-1" style={{ fontSize: "0.75rem" }}>
                        <span className="text-light">Active: ₹{stats.theaterStats.activeRevenue.toLocaleString()}</span>
                        <span className="text-secondary">Inactive: ₹{stats.theaterStats.inactiveRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-6 col-md-3">
                    <div className="metric-card p-3" style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      borderLeft: '4px solid #ef4444',
                      borderRadius: '4px'
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="text-secondary small">Total Refunds</span>
                        <FaTimes className="text-danger" size={14} />
                      </div>
                      <h3 className="text-danger mb-0">₹{stats.theaterStats.refunds.toLocaleString()}</h3>
                    </div>
                  </div>
                  
                  <div className="col-6 col-md-3">
                    <div className="metric-card p-3" style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      borderLeft: '4px solid #f5f5f5',
                      borderRadius: '4px'
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="text-secondary small">Net Revenue</span>
                        <FaChartLine className="text-white" size={14} />
                      </div>
                      <h3 className="text-white mb-0">₹{stats.theaterStats.netRevenue.toLocaleString()}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Filters with Shows-like Layout */}
          <div className="filters-container mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Filters - with border-bottom and no background */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
              <h5 className="text-white mb-2 mb-md-0 d-flex align-items-center">
                <FaFilter className="me-2 text-primary" />
                Filter Bookings
              </h5>
              <Button 
                variant="outline-secondary"
                size="sm"
                onClick={clearFilters}
              >
                Clear All Filters
              </Button>
            </div>
            
            <Row className="g-3">
              <Col lg={6} md={8} xs={12}>
                <div className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden" style={{ height: '46px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 30 30" fill="#6B7280">
                    <path d="M13 3C7.489 3 3 7.489 3 13s4.489 10 10 10a9.95 9.95 0 0 0 6.322-2.264l5.971 5.971a1 1 0 1 0 1.414-1.414l-5.97-5.97A9.95 9.95 0 0 0 23 13c0-5.511-4.489-10-10-10m0 2c4.43 0 8 3.57 8 8s-3.57 8-8 8-8-3.57-8-8 3.57-8 8-8"/>
                  </svg>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, or booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 bg-transparent w-100 h-100 ms-2"
                    style={{ 
                      outline: 'none', 
                      boxShadow: 'none', 
                      color: '#ffffff', 
                      fontSize: '16px',
                      fontWeight: '400'
                    }}
                  />
                </div>
              </Col>

              <Col lg={2} md={4} xs={6}>
                <div className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden" style={{ height: '46px' }}>
                  <FaCalendarAlt className="text-secondary" />
                  <Form.Control
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border-0 bg-transparent w-100 h-100 ms-2"
                    style={{ 
                      outline: 'none', 
                      boxShadow: 'none', 
                      color: '#ffffff', 
                      fontSize: '16px',
                      fontWeight: '400'
                    }}
                  />
                </div>
              </Col>
              
              <Col lg={2} md={4} xs={6}>
                <div className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden" style={{ height: '46px' }}>
                  <FaCheck className="text-secondary" />
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-0 bg-transparent w-100 h-100 ms-2"
                    style={{ 
                      outline: 'none', 
                      boxShadow: 'none', 
                      color: '#ffffff', 
                      fontSize: '16px',
                      fontWeight: '400',
                      backgroundColor: 'transparent',
                      backgroundImage: 'none'
                    }}
                    data-bs-theme="dark"
                  >
                    <option value="">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                </div>
              </Col>
              
              <Col lg={2} md={4} xs={12}>
                <Button
                  variant="outline-secondary"
                  onClick={clearFilters}
                  className="w-100 rounded-pill"
                  style={{ height: '46px' }}
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
            
            {/* Theater Filter Section */}
            <motion.div 
              className="theater-filter-container mt-4" 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
                <h5 className="text-white mb-2 mb-md-0 d-flex align-items-center">
                  <FaBuilding className="me-2 text-primary" />
                  Theater Filter
                </h5>
                {theaterFilter && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setTheaterFilter('')}
                    >
                      <FaTimes className="me-1" />
                      Clear Theater
                    </Button>
                  </motion.div>
                )}
              </div>
              
              <Row className="g-3">
                <Col lg={8} md={8} xs={12}>
                  <div className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden" style={{ height: '46px' }}>
                    <FaBuilding className="text-secondary" />
                    <Form.Select
                      value={theaterFilter}
                      onChange={(e) => setTheaterFilter(e.target.value)}
                      className="border-0 bg-transparent w-100 h-100 ms-2"
                      style={{ 
                        outline: 'none', 
                        boxShadow: 'none', 
                        color: '#ffffff', 
                        fontSize: '16px',
                        fontWeight: '400',
                        backgroundColor: 'transparent',
                        backgroundImage: 'none'
                      }}
                      data-bs-theme="dark"
                    >
                      <option value="">All Theaters</option>
                      {theaters.map(theater => (
                        <option key={theater._id} value={theater._id}>
                          {theater.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>
                
                <Col lg={4} md={4} xs={12}>
                  <div className="d-flex align-items-center border border-secondary rounded-pill px-3 overflow-hidden" style={{ height: '46px' }}>
                    <FaSortAmountDown className="text-secondary" />
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border-0 bg-transparent w-100 h-100 ms-2"
                      style={{ 
                        outline: 'none', 
                        boxShadow: 'none', 
                        color: '#ffffff', 
                        fontSize: '16px',
                        fontWeight: '400',
                        backgroundColor: 'transparent',
                        backgroundImage: 'none'
                      }}
                      data-bs-theme="dark"
                    >
                      <option value="bookingDate">Sort by Date</option>
                      <option value="totalAmount">Sort by Amount</option>
                      <option value="status">Sort by Status</option>
                      <option value="customerName">Sort by Customer</option>
                    </Form.Select>
                    <Button
                      variant="link"
                      className="p-0 ms-2"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      style={{ color: '#6c757d' }}
                    >
                      {sortOrder === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
                    </Button>
                  </div>
                </Col>
              </Row>
            </motion.div>
            
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mt-3 pt-3 border-top border-secondary">
              <div className="d-flex align-items-center text-secondary mb-2 mb-md-0">
                <FaChartLine className="me-2" />
                <span>
                  <strong>{filteredBookings.length}</strong> bookings found
                </span>
              </div>
              <div className="d-flex align-items-center text-secondary">
                <span>
                  Revenue:{" "}
                  <strong className="text-success">
                    ₹
                    {filteredBookings
                      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
                      .toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Bookings Display */}
          {filteredBookings.length > 0 ? (
            <>
              <div className="table-responsive" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <AdminBookingsTable
                  bookings={filteredBookings}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>

              {/* Enhanced Pagination */}
              {pagination.totalPages > 1 && (
                <motion.div 
                  className="pagination-container mt-4 p-3"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-center gap-3">
                    {/* Pagination Info */}
                    <div className="pagination-info d-flex flex-column flex-sm-row align-items-center gap-2">
                      <div className="text-light small">
                        Showing <strong className="text-primary">{(pagination.currentPage - 1) * 20 + 1}</strong> to{" "}
                        <strong className="text-primary">
                          {Math.min(pagination.currentPage * 20, pagination.totalBookings)}
                        </strong>{" "}
                        of <strong className="text-success">{pagination.totalBookings}</strong> bookings
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-secondary small">Page</span>
                        <Badge bg="primary" className="px-2 py-1">
                          {pagination.currentPage} / {pagination.totalPages}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="pagination-controls d-flex align-items-center gap-1">
                      {/* First Page */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline-light"
                          size="sm"
                          disabled={pagination.currentPage === 1 || loading}
                          onClick={() => fetchBookings(1)}
                          className="px-3"
                          title="First Page"
                        >
                          ««
                        </Button>
                      </motion.div>
                      
                      {/* Previous Page */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline-light"
                          size="sm"
                          disabled={!pagination.hasPrev || loading}
                          onClick={() => fetchBookings(pagination.currentPage - 1)}
                          className="px-3"
                          title="Previous Page"
                        >
                          ‹ Prev
                        </Button>
                      </motion.div>

                      {/* Page Numbers with Smart Display */}
                      {(() => {
                        const current = pagination.currentPage;
                        const total = pagination.totalPages;
                        const pages = [];
                        
                        // Always show first page
                        if (current > 3) {
                          pages.push(1);
                          if (current > 4) pages.push('...');
                        }
                        
                        // Show pages around current
                        const start = Math.max(1, current - 1);
                        const end = Math.min(total, current + 1);
                        
                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }
                        
                        // Always show last page
                        if (current < total - 2) {
                          if (current < total - 3) pages.push('...');
                          pages.push(total);
                        }
                        
                        return pages.map((page, index) => {
                          if (page === '...') {
                            return (
                              <span key={`ellipsis-${index}`} className="text-secondary px-2">
                                ...
                              </span>
                            );
                          }
                          
                          return (
                            <motion.div 
                              key={page} 
                              whileHover={{ scale: 1.05 }} 
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant={page === current ? "primary" : "outline-light"}
                                size="sm"
                                disabled={loading}
                                onClick={() => fetchBookings(page)}
                                className="px-3"
                                style={{ minWidth: '40px' }}
                              >
                                {page}
                              </Button>
                            </motion.div>
                          );
                        });
                      })()}

                      {/* Next Page */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline-light"
                          size="sm"
                          disabled={!pagination.hasNext || loading}
                          onClick={() => fetchBookings(pagination.currentPage + 1)}
                          className="px-3"
                          title="Next Page"
                        >
                          Next ›
                        </Button>
                      </motion.div>
                      
                      {/* Last Page */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline-light"
                          size="sm"
                          disabled={pagination.currentPage === pagination.totalPages || loading}
                          onClick={() => fetchBookings(pagination.totalPages)}
                          className="px-3"
                          title="Last Page"
                        >
                          »»
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Quick Jump */}
                  <div className="d-flex justify-content-center mt-3 pt-3 border-top border-secondary">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-secondary small">Jump to page:</span>
                      <Form.Control
                        type="number"
                        size="sm"
                        min="1"
                        max={pagination.totalPages}
                        value={pagination.currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= pagination.totalPages) {
                            fetchBookings(page);
                          }
                        }}
                        style={{ width: '80px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                        className="text-center"
                      />
                      <span className="text-secondary small">of {pagination.totalPages}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bookings-empty-state"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <FaTicketAlt className="empty-icon" />
              </motion.div>
              <motion.h4
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                No Bookings Found
              </motion.h4>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {searchTerm || statusFilter || dateFilter
                  ? "Try adjusting your search criteria"
                  : "No bookings have been made yet"}
              </motion.p>
            </motion.div>
          )}

          {/* Enhanced Booking Details Modal */}
          <Modal
            show={showModal}
            onHide={() => setShowModal(false)}
            size="xl"
            centered
            className="booking-details-modal"
          >
            <Modal.Header closeButton className="modal-header-enhanced">
              <Modal.Title className="text-white d-flex align-items-center">
                <div className="modal-icon me-3">
                  <FaTicketAlt size={24} />
                </div>
                <div>
                  <div className="modal-title-main">Edit Booking</div>
                  <div className="modal-title-sub">
                    {selectedBooking?.bookingId}
                  </div>
                </div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-body-enhanced p-0">
              {selectedBooking && (
                <div>
                  {/* Hero Section */}
                  <div className="booking-hero-section">
                    <div
                      className="hero-backdrop"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(${
                          selectedBooking.show?.movie?.poster ||
                          `https://via.placeholder.com/1920x1080/333/fff?text=${selectedBooking.show?.movie?.title?.charAt(0) || 'Movie'}`
                        })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#1f2025'
                      }}
                    ></div>
                    <div className="hero-content">
                      <Row className="align-items-center">
                        <Col md={12}>
                          <div className="hero-info">
                            <h2 className="movie-title">
                              {selectedBooking.movieTitle || selectedBooking.show?.movie?.title || "N/A"}
                              {(selectedBooking.show?.movie?.isActive === false || !selectedBooking.show?.movie) && (
                                <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.75rem', verticalAlign: 'middle' }}>Inactive Movie</Badge>
                              )}
                            </h2>
                            <div className="booking-status-large mb-3">
                              {getStatusBadge(selectedBooking.status)}
                            </div>
                            <div className="booking-meta">
                              <div className="meta-item">
                                <FaCalendarAlt className="meta-icon" />
                                <span>
                                  {moment(selectedBooking.bookingDate).format(
                                    "MMM DD, YYYY HH:mm"
                                  )}
                                </span>
                              </div>
                              <div className="meta-item">
                                <FaMapMarkerAlt className="meta-icon" />
                                <span>
                                  {selectedBooking.theaterName || selectedBooking.show?.theater?.name || "N/A"}
                                </span>
                              </div>
                              <div className="meta-item">
                                <FaMoneyBillWave className="meta-icon" />
                                <span className="amount-highlight">
                                  ₹{selectedBooking.totalAmount || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="booking-details-grid p-4">
                    <Row className="g-4">
                      {/* Customer Information */}
                      <Col lg={6}>
                        <Card className="detail-card">
                          <Card.Header className="detail-card-header">
                            <FaUser className="me-2" />
                            Customer Information
                          </Card.Header>
                          <Card.Body className="detail-card-body">
                            <div className="detail-row">
                              <span className="detail-label">Name</span>
                              <span className="detail-value">
                                {selectedBooking.customerName ||
                                  selectedBooking.user?.name ||
                                  "Guest"}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Email</span>
                              <span className="detail-value">
                                <FaEnvelope
                                  className="me-2 text-primary"
                                  size={12}
                                />
                                {selectedBooking.customerEmail ||
                                  selectedBooking.user?.email ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Booking ID</span>
                              <span className="detail-value booking-id-highlight">
                                {selectedBooking.bookingId}
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Theater & Show Information */}
                      <Col lg={6}>
                        <Card className="detail-card">
                          <Card.Header className="detail-card-header">
                            <FaMapMarkerAlt className="me-2" />
                            Theater & Show
                          </Card.Header>
                          <Card.Body className="detail-card-body">
                            <div className="detail-row">
                              <span className="detail-label">Theater</span>
                              <span className="detail-value">
                                {selectedBooking.show?.theater?.name || "N/A"}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Location</span>
                              <span className="detail-value">
                                {selectedBooking.show?.theater?.city ||
                                  selectedBooking.show?.theater?.location ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Show Date</span>
                              <span className="detail-value">
                                <FaCalendarAlt
                                  className="me-2 text-primary"
                                  size={12}
                                />
                                {selectedBooking.show?.showDate
                                  ? moment(
                                      selectedBooking.show.showDate
                                    ).format("MMM DD, YYYY")
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Show Time</span>
                              <span className="detail-value">
                                <FaClock
                                  className="me-2 text-primary"
                                  size={12}
                                />
                                {selectedBooking.show?.showTime || "N/A"}
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Seat Information */}
                      <Col lg={6}>
                        <Card className="detail-card">
                          <Card.Header className="detail-card-header">
                            <FaTicketAlt className="me-2" />
                            Seat Information
                          </Card.Header>
                          <Card.Body className="detail-card-body">
                            <div className="detail-row">
                              <span className="detail-label">Total Seats</span>
                              <span className="detail-value">
                                <Badge bg="info" className="seat-count-badge">
                                  {selectedBooking.seats?.length || 0} Seats
                                </Badge>
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Seat Numbers</span>
                              <div className="seat-numbers-grid">
                                {selectedBooking.seats?.map((seat, index) => (
                                  <motion.div
                                    key={index}
                                    className="seat-number-badge"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {seat}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Payment Information */}
                      <Col lg={6}>
                        <Card className="detail-card payment-card">
                          <Card.Header className="detail-card-header payment-header">
                            <FaMoneyBillWave className="me-2" />
                            Payment Information
                          </Card.Header>
                          <Card.Body className="detail-card-body">
                            <div className="detail-row">
                              <span className="detail-label">Total Amount</span>
                              <span className="detail-value payment-amount">
                                ₹{selectedBooking.totalAmount || 0}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">
                                Per Seat Price
                              </span>
                              <span className="detail-value">
                                ₹
                                {selectedBooking.seats?.length
                                  ? Math.round(
                                      selectedBooking.totalAmount /
                                        selectedBooking.seats.length
                                    )
                                  : 0}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">
                                Payment Status
                              </span>
                              <span className="detail-value">
                                <Badge
                                  bg="success"
                                  className="payment-status-badge"
                                >
                                  <FaCheck className="me-1" />
                                  Completed
                                </Badge>
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">
                                Transaction ID
                              </span>
                              <span className="detail-value transaction-id">
                                {selectedBooking.ticketId ||
                                  selectedBooking._id?.slice(-8) ||
                                  "N/A"}
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="modal-footer-enhanced">
              <div className="d-flex justify-content-between w-100 align-items-center">
                <div className="booking-actions-info">
                  <small className="text-white">
                    Last updated:{" "}
                    {selectedBooking
                      ? moment(
                          selectedBooking.updatedAt ||
                            selectedBooking.bookingDate
                        ).fromNow()
                      : "N/A"}
                  </small>
                </div>
                <div className="booking-actions">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowModal(false)}
                    className="me-2"
                  >
                    <FaTimes className="me-1" />
                    Close
                  </Button>
                  {selectedBooking?.status === "pending" && (
                    <Button
                      variant="success"
                      onClick={() => {
                        handleStatusUpdate(selectedBooking._id, "confirmed");
                        setShowModal(false);
                      }}
                      className="me-2"
                    >
                      <FaCheckCircle className="me-1" />
                      Confirm Booking
                    </Button>
                  )}
                  {selectedBooking?.status === "confirmed" && (
                    <Button
                      variant="warning"
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to cancel this booking? This will free up the seats and cannot be undone.")) {
                          try {
                            const response = await fetch(
                              `http://localhost:5000/api/bookings/${selectedBooking._id}/cancel`,
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                              }
                            );
                            
                            if (response.ok) {
                              toast.success("Booking cancelled successfully!");
                              fetchBookings(pagination.currentPage);
                              setShowModal(false);
                            } else {
                              const errorData = await response.json();
                              toast.error(errorData.message || "Failed to cancel booking");
                            }
                          } catch (error) {
                            console.error("Cancel booking error:", error);
                            toast.error("Failed to cancel booking");
                          }
                        }
                      }}
                      className="me-2"
                    >
                      <FaExclamationTriangle className="me-1" />
                      Cancel Booking
                    </Button>
                  )}
                  <Button variant="outline-info" onClick={() => window.print()}>
                    <FaPrint className="me-1" />
                    Print
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </Modal>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
