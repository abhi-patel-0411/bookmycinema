import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Badge, Form, InputGroup, Pagination, Row, Col } from 'react-bootstrap';
import { FaSearch, FaEye, FaEdit, FaTrash, FaTicketAlt, FaUsers, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaFilm } from 'react-icons/fa';
import { motion } from 'framer-motion';
import '../../../styles/admin-table.css';
import '../../styles/admin-responsive-tables.css';

const AdminTable = ({ 
  data = [], 
  columns = [], 
  title = "Data Management",
  onView,
  onEdit, 
  onDelete,
  loading = false,
  pagination = null,
  onPageChange,
  searchable = true,
  onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const items = [];
    const { currentPage, totalPages, hasPrev, hasNext } = pagination;

    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev"
        disabled={!hasPrev}
        onClick={() => handlePageChange(currentPage - 1)}
      />
    );

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        items.push(<Pagination.Ellipsis key={`ellipsis-${i}`} />);
      }
    }

    // Next button
    items.push(
      <Pagination.Next 
        key="next"
        disabled={!hasNext}
        onClick={() => handlePageChange(currentPage + 1)}
      />
    );

    return (
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="pagination-info">
          Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalBookings || pagination.totalShows || 0)} of {pagination.totalBookings || pagination.totalShows || 0} entries
        </div>
        <Pagination className="mb-0">{items}</Pagination>
      </div>
    );
  };

  const renderCellContent = (item, column) => {
    const value = column.accessor.split('.').reduce((obj, key) => obj?.[key], item);
    
    if (column.render) {
      return column.render(value, item);
    }
    
    return value || 'N/A';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-table-container"
    >
      <Card className="admin-table-card">
        <Card.Header className="admin-table-header">
          <Row className="align-items-center">
            <Col md={6}>
              <h4 className="table-title mb-0">
                <FaFilm className="me-2" />
                {title}
              </h4>
            </Col>
            <Col md={6}>
              {searchable && (
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                  />
                </InputGroup>
              )}
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Desktop Table */}
          <div className="d-none d-lg-block">
            <Table responsive hover className="admin-data-table mb-0">
              <thead>
                <tr>
                  {columns.map((column, index) => (
                    <th key={index} className={column.className || ''}>
                      {column.icon && <column.icon className="me-2" />}
                      {column.header}
                    </th>
                  ))}
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-4">
                      <div className="loading-spinner">Loading...</div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-4">
                      <div className="no-data">No data available</div>
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <motion.tr
                      key={item._id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="table-row"
                    >
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className={column.className || ''}>
                          {renderCellContent(item, column)}
                        </td>
                      ))}
                      <td className="text-center">
                        <div className="action-buttons">
                          {onView && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="action-btn me-1"
                              onClick={() => onView(item)}
                            >
                              <FaEye />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="action-btn me-1"
                              onClick={() => onEdit(item)}
                            >
                              <FaEdit />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="action-btn"
                              onClick={() => onDelete(item)}
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="d-lg-none">
            <div className="mobile-cards-container">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : data.length === 0 ? (
                <div className="text-center py-4">No data available</div>
              ) : (
                data.map((item, index) => (
                  <motion.div
                    key={item._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="mobile-card"
                  >
                    <Card className="mb-3 admin-mobile-card">
                      <Card.Body>
                        {columns.slice(0, 4).map((column, colIndex) => (
                          <div key={colIndex} className="mobile-field">
                            <div className="field-label">
                              {column.icon && <column.icon className="me-2" />}
                              {column.header}:
                            </div>
                            <div className="field-value">
                              {renderCellContent(item, column)}
                            </div>
                          </div>
                        ))}
                        <div className="mobile-actions mt-3">
                          {onView && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => onView(item)}
                            >
                              <FaEye className="me-1" /> View
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="me-2"
                              onClick={() => onEdit(item)}
                            >
                              <FaEdit className="me-1" /> Edit
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => onDelete(item)}
                            >
                              <FaTrash className="me-1" /> Delete
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </Card.Body>

        {renderPagination()}
      </Card>
    </motion.div>
  );
};

export default AdminTable;