import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import ClerkProviderWrapper from "./contexts/ClerkProvider";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
// import ClerkUserSync from './components/common/ClerkUserSync';
import AOS from "aos";
import { ReactLenis } from "lenis/react";
import useScrollToTop from "./hooks/useScrollToTop";

// Import CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "aos/dist/aos.css";
import "./styles/global-enhancements.css";
import "./styles/modern-notifications.css";

// Components
import CustomNavbar from "./components/common/CustomNavbar";
import ModernLoader from "./components/common/ModernLoader";
import BrandLogo from "./components/common/BrandLogo";
import ClerkProtectedRoute from "./components/common/ClerkProtectedRoute";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import ClerkSignIn from "./pages/ClerkSignIn";
import ClerkSignUp from "./pages/ClerkSignUp";
import ClerkUserProfile from "./pages/ClerkUserProfile";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import ShowTimes from "./pages/ShowTimes";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import MyBookings from "./pages/MyBookings";
import BookingConfirmation from "./pages/BookingConfirmation";
import Theaters from "./pages/Theaters";
import PaymentTest from "./components/payment/PaymentTest";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminTheaters from "./pages/admin/AdminTheaters";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminShows from "./pages/admin/AdminShows";
import AdminUsers from "./pages/admin/AdminUsers";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  // No loading screens - direct access

  if (!user) return <Navigate to="/login" />;

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
};

const AppContentWrapper = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <div className="App">
        <AppContent />
      </div>
    );
  }

  return (
    <ReactLenis
      root
      options={{
        duration: 1.0,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        mouseMultiplier: 0.8,
        smoothTouch: false,
        touchMultiplier: 1.5,
        lerp: 0.12,
        normalizeWheel: true,
      }}
    >
      <div className="App">
        <AppContent />
      </div>
    </ReactLenis>
  );
};

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname.startsWith("/sign-in") || location.pathname.startsWith("/sign-up");
  
  useScrollToTop();

  // No loading screens - direct access to all pages

  return (
    <>
      {!isAdminRoute && !isAuthRoute && location.pathname !== "/payment" && (
        <CustomNavbar />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/sign-in/*" element={<ClerkSignIn />} />
        <Route path="/sign-up/*" element={<ClerkSignUp />} />

        <Route path="/clerk-profile/*" element={<ClerkUserProfile />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/theaters" element={<Theaters />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/movie/:movieId/showtimes" element={<ShowTimes />} />

        <Route path="/booking/:showId" element={<BookingPage />} />
        
        <Route
          path="/payment"
          element={
            <ClerkProtectedRoute>
              <PaymentPage />
            </ClerkProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ClerkProtectedRoute>
              <MyBookings />
            </ClerkProtectedRoute>
          }
        />

        <Route
          path="/booking-confirmation/:bookingId"
          element={
            <ClerkProtectedRoute>
              <BookingConfirmation />
            </ClerkProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ClerkProtectedRoute adminOnly>
              <AdminDashboard />
            </ClerkProtectedRoute>
          }
        />

        <Route
          path="/admin/movies"
          element={
            <ClerkProtectedRoute adminOnly>
              <AdminMovies />
            </ClerkProtectedRoute>
          }
        />

        <Route
          path="/admin/theaters"
          element={
            <ClerkProtectedRoute adminOnly>
              <AdminTheaters />
            </ClerkProtectedRoute>
          }
        />

        <Route
          path="/admin/bookings"
          element={
            <ClerkProtectedRoute adminOnly>
              <AdminBookings />
            </ClerkProtectedRoute>
          }
        />

        <Route
          path="/admin/shows"
          element={
            <ClerkProtectedRoute adminOnly>
              <AdminShows />
            </ClerkProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ClerkProtectedRoute adminOnly>
              <AdminUsers />
            </ClerkProtectedRoute>
          }
        />
        
        {/* Payment Test Route - Remove in production */}
        <Route path="/payment-test" element={<PaymentTest />} />
      </Routes>
      {!isAdminRoute && !isAuthRoute && location.pathname !== "/payment" && <Footer />}
    </>
  );
};

function App() {
  const [showBrandAnimation, setShowBrandAnimation] = useState(() => {
    return !sessionStorage.getItem("brandAnimationShown");
  });

  const handleBrandComplete = () => {
    sessionStorage.setItem("brandAnimationShown", "true");
    setShowBrandAnimation(false);
  };

  useEffect(() => {
    if (showBrandAnimation) {
      const timer = setTimeout(() => {
        handleBrandComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBrandAnimation]);

  useEffect(() => {
    // Suppress extension-related errors
    window.addEventListener('error', (e) => {
      if (e.message.includes('message channel closed') || 
          e.message.includes('listener indicated an asynchronous response')) {
        e.preventDefault();
        return false;
      }
    });
    
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out-quart",
      offset: 50,
      delay: 0,
      anchorPlacement: 'top-bottom'
    });
  }, []);

  if (showBrandAnimation) {
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
          background: "#1f2025",
          zIndex: 10000,
        }}
        onClick={handleBrandComplete}
      >
        <div style={{ transform: 'scale(2)' }}>
          <BrandLogo />
        </div>
      </div>
    );
  }

  return (
    <ClerkProviderWrapper>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppContentWrapper />
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              toastClassName="modern-toast"
              bodyClassName="modern-toast-body"
              progressClassName="modern-progress"
              limit={5}
            />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ClerkProviderWrapper>
  );
}

export default App;
