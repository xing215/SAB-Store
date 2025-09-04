import React from 'react';
import { Navigate } from 'react-router-dom';
import { adminService } from '../../services/api';

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = adminService.isLoggedIn();

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
