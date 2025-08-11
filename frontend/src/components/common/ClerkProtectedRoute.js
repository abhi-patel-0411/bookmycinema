import React from "react";
import { useAuth, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import ModernLoader from "./ModernLoader";

const ClerkProtectedRoute = ({ children, adminOnly = false }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <ModernLoader text="Authenticating" />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Check if user has admin role in any metadata location
  const isAdmin =
    user?.publicMetadata?.role === "admin" ||
    user?.unsafeMetadata?.role === "admin" ||
    user?.privateMetadata?.role === "admin" ||
    user?.emailAddresses?.some((email) =>
      email.emailAddress?.endsWith("@admin.com")
    );

  if (adminOnly && !isAdmin) {
    return (
      <div className="page-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h2 className="text-danger mb-3">Access Denied</h2>
          <p className="text-secondary">
            You don't have permission to access this page.
          </p>
          <p className="text-muted">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ClerkProtectedRoute;
