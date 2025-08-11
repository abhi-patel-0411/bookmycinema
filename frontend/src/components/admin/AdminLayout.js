import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { UserButton, useUser, useClerk } from "@clerk/clerk-react";
import { FaTicketAlt, FaSignOutAlt, FaUser } from "react-icons/fa";
import BrandLogo from "../common/BrandLogo";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/admin-global.css";
import "../../styles/admin-responsive.css";


const AdminLayout = ({ children }) => {
  const location = useLocation();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const dashboardicon = (
    <svg
      className="me-2"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm16 14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2ZM4 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Zm16-2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6Z"
      />
    </svg>
  );

  const moviesicon = (
    <svg
      className="me-2"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        d="M7.111 20A3.111 3.111 0 0 1 4 16.889v-12C4 4.398 4.398 4 4.889 4h4.444a.89.89 0 0 1 .89.889v12A3.111 3.111 0 0 1 7.11 20Zm0 0h12a.889.889 0 0 0 .889-.889v-4.444a.889.889 0 0 0-.889-.89h-4.389a.889.889 0 0 0-.62.253l-3.767 3.665a.933.933 0 0 0-.146.185c-.868 1.433-1.581 1.858-3.078 2.12Zm0-3.556h.009m7.933-10.927 3.143 3.143a.889.889 0 0 1 0 1.257l-7.974 7.974v-8.8l3.574-3.574a.889.889 0 0 1 1.257 0Z"
      />
    </svg>
  );

  const bookingsicon = (
    <svg
      className="me-2"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M7 9h5m3 0h2M7 12h2m3 0h5M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-6.616a1 1 0 0 0-.67.257l-2.88 2.592A.5.5 0 0 1 8 18.477V17a1 1 0 0 0-1-1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
      />
    </svg>
  );

  const theatersicon = (
    <svg
      className="me-2"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeWidth="2"
        d="M3 21h18M4 18h16M6 10v8m4-8v8m4-8v8M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M8 4V2m8 2V2"
      />
    </svg>
  );

  const showsicon = (
    <svg
      className="me-2"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
      />
    </svg>
  );

  const usersicon = (
    <svg
      className="me-2"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z"
      />
    </svg>
  );

  const sidebarLinks = [
    { name: "Dashboard", path: "/admin", icon: dashboardicon },
    { name: "Movies", path: "/admin/movies", icon: moviesicon },
    { name: "Theaters", path: "/admin/theaters", icon: theatersicon },
    { name: "Shows", path: "/admin/shows", icon: showsicon },
    { name: "Bookings", path: "/admin/bookings", icon: bookingsicon },
    { name: "Users", path: "/admin/users", icon: usersicon },
  ];

  // Logout is handled directly in the navbar

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#1f2025",
      }}
    >
      {/* Header */}
      <div
        className="d-flex align-items-center justify-content-between px-2 px-md-4 py-2 py-md-3 border-bottom"
        style={{
          height: isMobile ? "60px" : "70px",
          flexShrink: 0,
          background: "rgb(31, 32, 37)",
          borderColor: "rgb(55, 65, 81)",
          position: isMobile ? "fixed" : "relative",
          top: isMobile ? "0" : "auto",
          left: isMobile ? "0" : "auto",
          right: isMobile ? "0" : "auto",
          zIndex: isMobile ? 1001 : "auto",
        }}
      >
        <div className="d-flex align-items-center">
          <Link to="/" style={{ textDecoration: "none" }}>
            <BrandLogo
              className={isMobile ? "me-2" : "me-3"}
              style={{ transform: isMobile ? "scale(0.85)" : "none" }}
            />
          </Link>
          <div className="d-none d-sm-block">
            <h5
              className="text-white mb-0"
              style={{ fontSize: isMobile ? "0.9rem" : "1.25rem" }}
            >
              Admin
            </h5>
            <small
              className="text-light"
              style={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}
            >
              Management Panel
            </small>
          </div>
        </div>
        <div className="navbar-actions d-flex align-items-center">
          <div className="me-3 d-none d-md-block">
            <div className="text-end">
              <div className="text-white">
                {clerkUser?.firstName || "Admin"}
              </div>
              <small className="text-light">
                {clerkUser?.primaryEmailAddress?.emailAddress}
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "admin-user-avatar",
                  userButtonPopoverCard: "admin-clerk-dropdown",
                },
              }}
            />
            {/* <button
              className="btn btn-outline-danger btn-sm ms-2"
              onClick={handleLogout}
              title="Logout"
            >
              <FaSignOutAlt />
            </button> */}
          </div>
        </div>
      </div>

      <div
        className="d-flex"
        style={{
          height: "100vh",
        }}
      >
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div
            style={{
              width: "250px",
              background: "#1f2025",
              borderRight: "1px solid #374151",
              position: "fixed",
              height: isMobile ? "calc(100vh - 60px)" : "calc(100vh - 70px)",
              zIndex: 1000,
            }}
          >
            <div className="pt-4">
              {sidebarLinks.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    to={item.path}
                    key={index}
                    className="d-flex align-items-center text-decoration-none py-3 px-4 position-relative"
                    style={{
                      color: isActive ? "#e63946" : "#9ca3af",
                      background: isActive
                        ? "linear-gradient(135deg, #e63946, #f84565) !important"
                        : "transparent",
                      borderRight: isActive ? "4px solid #e63946" : "none",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor =
                          "rgba(255,255,255,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className="flex-grow-1 admin-page-wrapper"
          style={{
            background: "#1f2025",
            marginLeft: isMobile ? "0" : "250px",
            height: isMobile ? "100vh" : "calc(100vh - 70px)",
            overflowY: "auto",
            paddingBottom: isMobile ? "80px" : "0",
            paddingTop: isMobile ? "70px" : "0",
          }}
        >
          <div className="p-3">{children}</div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div
          className="position-fixed bottom-0 start-0 w-100 bg-dark border-top"
          style={{
            zIndex: 1000,
            borderColor: "#374151 !important",
            background: "#1f2025 !important",
          }}
        >
          <div className="d-flex justify-content-around py-2">
            {sidebarLinks.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  to={item.path}
                  key={index}
                  className="d-flex flex-column align-items-center text-decoration-none py-2 px-1"
                  style={{
                    color: isActive ? "#e63946" : "#9ca3af",
                    fontSize: "0.75rem",
                    minWidth: "60px",
                  }}
                >
                  <div className="mb-1">
                    {React.cloneElement(item.icon, {
                      className: "",
                      style: { width: "20px", height: "20px" },
                    })}
                  </div>
                  <span style={{ fontSize: "0.7rem" }}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
