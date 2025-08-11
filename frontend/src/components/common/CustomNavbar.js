import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaTimes, FaBars, FaTicketAlt, FaUser, FaHome, FaFilm, FaBuilding, FaEllipsisH, FaTachometerAlt, FaInfoCircle } from "react-icons/fa";
import { UserButton, SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import "../../styles/sticky-navbar.css";

import "../../styles/responsive-navbar.css";

import "../../styles/navbar-fix.css";

const CustomNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const audioRef = useRef(null);
  const { user } = useUser();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // Audio toggle handler
  const toggleAudio = async () => {
    if (audioRef.current) {
      try {
        if (isAudioPlaying) {
          audioRef.current.pause();
          setIsAudioPlaying(false);
        } else {
          audioRef.current.volume = 0.3;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsAudioPlaying(true);
          }
        }
      } catch (error) {
        console.log("Audio error:", error);
        setIsAudioPlaying(false);
      }
    }
  };

  // Handle scroll effect and resize
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }

    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [mobileMenuOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMobileDropdown(false);
    };
    
    if (showMobileDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMobileDropdown]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Define navigation links for mobile bottom bar
  const navLinks = [
    { name: "Home", path: "/", icon: <FaHome size={20} /> },
    { name: "Movies", path: "/movies", icon: <FaFilm size={20} /> },
    { name: "Theaters", path: "/theaters", icon: <FaBuilding size={20} /> },
    { name: "Bookings", path: "/my-bookings", icon: <FaTicketAlt size={20} />, requireAuth: true },
  ];

  return (
    <div className="navbar-wrapper">
      {/* Background Audio (hidden) */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        id="audio"
        style={{ display: "none" }}
      >
        <source src="/audio/background.mp3" type="audio/mpeg" />
      </audio>
      <div className={`custom-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <BrandLogo style={{ transform: isMobile ? "scale(0.85)" : "none" }} />
          </Link>

          <div className={`navbar-menu d-none d-md-flex ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <Link to="/" className="nav-link" onClick={closeMobileMenu}>
              Home
            </Link>
            <Link to="/movies" className="nav-link" onClick={closeMobileMenu}>
              Movies
            </Link>
            <Link to="/theaters" className="nav-link" onClick={closeMobileMenu}>
              Theaters
            </Link>
            <SignedIn>
              <Link
                to="/my-bookings"
                className="nav-link"
                onClick={closeMobileMenu}
              >
                <FaTicketAlt className="me-1" />
                My Bookings
              </Link>
            </SignedIn>
            {user?.publicMetadata?.role === "admin" && (
              <Link
                to="/admin"
                className="nav-link admin-link"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="navbar-actions d-flex align-items-center gap-2">
            {/* Audio Toggle Button */}
            <button
              type="button"
              className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                border: "none",
                fontSize: "1.2rem",
              }}
              onClick={toggleAudio}
              aria-label="Toggle background audio"
            >
              {isAudioPlaying ? "🔊" : "🔇"}
            </button>
            <SignedIn>
              <div className="user-button">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "user-avatar",
                      userButtonPopoverCard: "clerk-dropdown",
                    },
                  }}
                  userProfileProps={{
                    additionalOAuthScopes: {
                      google: [
                        "https://www.googleapis.com/auth/userinfo.email",
                      ],
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="My Bookings"
                      labelIcon={<FaTicketAlt />}
                      href="/my-bookings"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            </SignedIn>

            <SignedOut>
              <div className="auth-buttons d-none d-md-flex gap-2">
                <Link to="/sign-in" className="btn btn-outline-primary btn-sm">
                  Login
                </Link>
                <Link to="/sign-up" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            </SignedOut>


          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          <div
            className="position-fixed bottom-0 start-0 w-100 bg-dark border-top"
            style={{
              zIndex: 1000,
              borderColor: "rgba(255,255,255,0.1) !important",
              background: "rgba(31, 32, 37, 0.95) !important",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="d-flex justify-content-around py-2">
              {navLinks.map((item, index) => {
                // Skip items that require auth if user is not signed in
                if (item.requireAuth && !user) return null;
                
                // Check if current path matches this nav item
                const isActive = window.location.pathname === item.path || 
                  (item.path !== "/" && window.location.pathname.startsWith(item.path));
                  
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
                    <div className="mb-1" style={{ color: isActive ? "#e63946" : "#9ca3af" }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: "0.7rem" }}>{item.name}</span>
                  </Link>
                );
              })}
              

              

              
              {/* More Options Dropdown */}
              <div className="position-relative">
                <button
                  className="d-flex flex-column align-items-center py-2 px-1 border-0 bg-transparent"
                  style={{
                    color: showMobileDropdown ? "#e63946" : "#9ca3af",
                    fontSize: "0.75rem",
                    minWidth: "60px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMobileDropdown(!showMobileDropdown);
                  }}
                >
                  <div className="mb-1">
                    <FaEllipsisH size={20} />
                  </div>
                  <span style={{ fontSize: "0.7rem" }}>More</span>
                </button>
                
                {/* Dropdown Menu */}
                {showMobileDropdown && (
                  <div
                    className="position-absolute mb-2"
                    style={{
                      bottom: "100%",
                      right: "0",
                      background: "rgba(31, 32, 37, 0.98)",
                      backdropFilter: "blur(20px)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      minWidth: "180px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      zIndex: 1002,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SignedIn>
                      <Link
                        to="/clerk-profile"
                        className="d-flex align-items-center px-3 py-2 text-decoration-none border-bottom"
                        style={{ 
                          color: "#9ca3af",
                          borderColor: "rgba(255,255,255,0.1)"
                        }}
                        onClick={() => setShowMobileDropdown(false)}
                      >
                        {/* <FaUser className="me-2" size={16} /> */}
                        {/* <span>Profile</span> */}
                      </Link>
                    </SignedIn>
                    
                    <SignedOut>
                      <Link
                        to="/sign-in"
                        className="d-flex align-items-center px-3 py-2 text-decoration-none border-bottom"
                        style={{ 
                          color: "#9ca3af",
                          borderColor: "rgba(255,255,255,0.1)"
                        }}
                        onClick={() => setShowMobileDropdown(false)}
                      >
                        <FaUser className="me-2" size={16} />
                        <span>Login</span>
                      </Link>
                    </SignedOut>
                    
                    {user?.publicMetadata?.role === "admin" && (
                      <button
                        className="d-flex align-items-center px-3 py-2 text-decoration-none border-bottom w-100 bg-transparent border-0 text-start"
                        style={{ 
                          color: "#9ca3af",
                          borderColor: "rgba(255,255,255,0.1) !important"
                        }}
                        onClick={() => {
                          setShowMobileDropdown(false);
                          window.location.href = '/admin';
                        }}
                      >
                        <FaTachometerAlt className="me-2" size={16} />
                        <span>Admin Panel</span>
                      </button>
                    )}
                    
                    <Link
                      to="/about"
                      className="d-flex align-items-center px-3 py-2 text-decoration-none"
                      style={{ color: "#9ca3af" }}
                      onClick={() => setShowMobileDropdown(false)}
                    >
                      <FaInfoCircle className="me-2" size={16} />
                      <span>About</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Backdrop to close dropdown */}
          {showMobileDropdown && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100"
              onClick={() => setShowMobileDropdown(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CustomNavbar;
