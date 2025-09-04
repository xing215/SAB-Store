import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { sellerService } from '../../services/api';

const SellerProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = sellerService.isLoggedIn();

  if (!isLoggedIn) {
    // Redirect to seller login page with the current location
    return <Navigate to="/seller/login" state={{ from: location }} replace />;
  }

  return children;
};

export default SellerProtectedRoute;
