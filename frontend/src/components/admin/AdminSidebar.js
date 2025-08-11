import React from "react";
import { Nav, Dropdown } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useClerk } from "@clerk/clerk-react";
import BrandLogo from "../common/BrandLogo";

const AdminSidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      // Handle both Clerk and regular logout
      if (signOut) {
        await signOut();
      }
      if (logout) {
        logout();
      }
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    { path: "/admin", label: "Dashboard" },
    { path: "/admin/movies", label: "Movies" },
    { path: "/admin/bookings", label: "Bookings" },
    { path: "/admin/theaters", label: "Theaters" },
    { path: "/admin/shows", label: "Shows" },
  ];

  // Get first letter of name for avatar
  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "A";
  };

  return (
    <motion.div
      className="admin-sidebar"
      initial={{ x: isOpen ? 0 : -240 }}
      animate={{ x: isOpen ? 0 : -240 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "240px",
        background: "#1a1b1f",
        borderRight: "1px solid #374151",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="p-4 border-bottom border-dark">
        <BrandLogo height="30" />
      </div>
      {/* Profile Section */}
      <Dropdown
        className="p-3 border-bottom"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Dropdown.Toggle
          as="div"
          id="profile-dropdown"
          className="d-flex align-items-center"
          style={{ cursor: "pointer" }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: "50px",
              height: "50px",
              background: "linear-gradient(135deg, #3a7bd5, #00d2ff)",
            }}
          >
            <span className="text-white fw-bold">{getInitial()}</span>
          </div>
          <div className="ms-3">
            <div className="text-white fw-bold">{user?.name || "Admin"}</div>
            <div className="text-light small">
              {user?.role || "Administrator"}
            </div>
          </div>
        </Dropdown.Toggle>

        <Dropdown.Menu
          style={{
            background: "#2a2d35",
            marginTop: "10px",
            borderColor: "#374151",
          }}
        >
          <Dropdown.Item as={Link} to="/admin/profile" className="text-light">
            Profile
          </Dropdown.Item>
          <Dropdown.Item as={Link} to="/admin/settings" className="text-light">
            Settings
          </Dropdown.Item>
          <Dropdown.Divider style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          <Dropdown.Item onClick={handleLogout} className="text-danger">
            Logout
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <Nav className="flex-column pt-3">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          return (
            <Nav.Item key={index}>
              <Nav.Link
                as={Link}
                to={item.path}
                className={`d-flex align-items-center py-3 px-4 ${
                  isActive ? "active" : ""
                }`}
                style={{
                  color: isActive ? "#fff" : "#adb5bd",
                  background: isActive
                    ? "rgba(255, 255, 255, 0.1)"
                    : "transparent",
                  borderLeft: isActive
                    ? "4px solid #e63946"
                    : "4px solid transparent",
                  transition: "all 0.2s ease",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                }}
              >
                <span>{item.label}</span>
              </Nav.Link>
            </Nav.Item>
          );
        })}
      </Nav>
    </motion.div>
  );
};

export default AdminSidebar;
