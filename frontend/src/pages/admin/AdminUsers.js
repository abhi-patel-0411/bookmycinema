import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Pagination,
} from "react-bootstrap";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaToggleOn,
  FaUserShield,
  FaSync,
  FaUserCog,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useClerk } from "@clerk/clerk-react";
import AdminLayout from "../../components/admin/AdminLayout";
import ModernLoader from "../../components/common/ModernLoader";
import api from "../../services/api";
import { useClerkUsers } from "../../services/clerkService";
import "../../styles/admin-users.css";

const AdminUsers = () => {
  const { client } = useClerk();
  const { fetchClerkUsers } = useClerkUsers();
  const [users, setUsers] = useState([]);
  const [clerkUsers, setClerkUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clerkLoading, setClerkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDatabaseUsers = async () => {
    try {
      const dbResponse = await api.get("/users", {
        params: {
          page: currentPage,
          limit: 50,
        },
      });

      const dbUsers = dbResponse.data.users || dbResponse.data || [];
      setUsers(
        dbUsers.map((user) => ({
          ...user,
          id: user._id,
          type: "database",
          displayName: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          avatar: null,
        }))
      );
      setTotalPages(dbResponse.data.pagination?.pages || 1);
    } catch (error) {
      console.error("Fetch database users error:", error);
      toast.error("Failed to fetch database users");
      setUsers([]);
    }
  };

  const fetchClerkUsersList = async () => {
    try {
      setClerkLoading(true);
      const clerkUsersList = await fetchClerkUsers();
      setClerkUsers(clerkUsersList);
    } catch (error) {
      console.error("Fetch Clerk users error:", error);
      toast.error("Failed to fetch Clerk users");
      setClerkUsers([]);
    } finally {
      setClerkLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchDatabaseUsers(), fetchClerkUsersList()]);
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Combine users when either list changes
  useEffect(() => {
    const combinedUsers = [...users, ...clerkUsers];
    setAllUsers(combinedUsers);
  }, [users, clerkUsers]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  // Refresh Clerk users periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (client) {
        fetchClerkUsersList();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [client]);

  if (loading && users.length === 0) return <ModernLoader text="Loading Users" />;

  return (
    <AdminLayout>
      <div className="admin-users-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
            <div className="mb-3 mb-md-0">
              <h1 className="text-white mb-2">User Management</h1>
              <p className="text-secondary mb-0">View system users</p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-info"
                onClick={fetchClerkUsersList}
                disabled={clerkLoading}
                style={{ borderRadius: "10px" }}
              >
                <FaSync className={`me-2 ${clerkLoading ? "fa-spin" : ""}`} />
                Refresh Users
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <Row className="mb-4 g-3">
            <Col md={4} sm={6}>
              <Card
                className="border-0 h-100"
                style={{
                  borderRadius: "15px",
                  background: "linear-gradient(135deg, #3a7bd5, #00d2ff)",
                  boxShadow: "0 10px 20px rgba(0, 210, 255, 0.2)",
                }}
              >
                <Card.Body className="text-center p-4">
                  <div
                    className="rounded-circle bg-white bg-opacity-25 p-3 mx-auto mb-3"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <FaUsers size={24} className="text-white" />
                  </div>
                  <h3 className="text-white mb-1">{allUsers.length}</h3>
                  <p className="text-white mb-0 opacity-75">Total Users</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} sm={6}>
              <Card
                className="border-0 h-100"
                style={{
                  borderRadius: "15px",
                  background: "linear-gradient(135deg, #e63946, #f84565)",
                  boxShadow: "0 10px 20px rgba(232, 57, 70, 0.2)",
                }}
              >
                <Card.Body className="text-center p-4">
                  <div
                    className="rounded-circle bg-white bg-opacity-25 p-3 mx-auto mb-3"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <FaUserShield size={24} className="text-white" />
                  </div>
                  <h3 className="text-white mb-1">
                    {allUsers.filter((u) => u.role === "admin").length}
                  </h3>
                  <p className="text-white mb-0 opacity-75">Admin Users</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Users Table - View Only */}
          <div
            className="card border-0"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="table-responsive">
              <Table hover variant="dark" className="mb-0">
                <thead
                  style={{
                    background: "linear-gradient(135deg, #e63946, #f84565)",
                  }}
                >
                  <tr>
                    <th className="py-3" style={{ minWidth: "250px" }}>
                      User
                    </th>
                    <th className="py-3" style={{ minWidth: "250px" }}>
                      Email
                    </th>
                    <th className="py-3" style={{ minWidth: "150px" }}>
                      Role
                    </th>
                    <th className="py-3" style={{ minWidth: "120px" }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.length > 0 ? (
                    allUsers.map((user) => (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: "45px",
                                height: "45px",
                                background:
                                  user.role === "admin"
                                    ? "linear-gradient(135deg, #e63946, #f84565)"
                                    : user.role === "clerk"
                                    ? "linear-gradient(135deg, #f953c6, #b91d73)"
                                    : "linear-gradient(135deg, #3a7bd5, #00d2ff)",
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "18px",
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                              }}
                            >
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.displayName}
                                  style={{
                                    width: "45px",
                                    height: "45px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                user.displayName?.charAt(0)?.toUpperCase() ||
                                "U"
                              )}
                            </div>
                            <div>
                              <div className="fw-bold text-white">
                                {user.displayName || "N/A"}
                              </div>
                              <div className="text-secondary small">
                                {user.email || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary align-middle">
                          {user.email || "N/A"}
                        </td>
                        <td className="align-middle">
                          <Badge
                            bg={
                              user.role === "admin"
                                ? "danger"
                                : user.role === "clerk"
                                ? "warning"
                                : "primary"
                            }
                            style={{
                              borderRadius: "20px",
                              padding: "5px 10px",
                              fontWeight: "normal",
                            }}
                          >
                            {user.role?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="text-secondary align-middle">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        <div className="text-secondary">
                          <FaUsers size={48} className="mb-3 opacity-50" />
                          <p className="mb-0">No users found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination className="pagination-custom">
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: "#2a2d35", borderColor: "#6c757d" }}
                />
                <Pagination.Prev
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: "#2a2d35", borderColor: "#6c757d" }}
                />

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show only relevant pagination items
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 &&
                      pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === currentPage}
                        onClick={() => setCurrentPage(pageNumber)}
                        style={{
                          backgroundColor:
                            pageNumber === currentPage ? "#e63946" : "#2a2d35",
                          borderColor: "#6c757d",
                        }}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <Pagination.Ellipsis
                        key={pageNumber}
                        style={{
                          backgroundColor: "#2a2d35",
                          borderColor: "#6c757d",
                        }}
                      />
                    );
                  }
                  return null;
                })}

                <Pagination.Next
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ backgroundColor: "#2a2d35", borderColor: "#6c757d" }}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{ backgroundColor: "#2a2d35", borderColor: "#6c757d" }}
                />
              </Pagination>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
