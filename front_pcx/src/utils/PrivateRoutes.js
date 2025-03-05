/**
 * PrivateRoutes.js
 * Protects routes that require authentication and specific user roles
 */
import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { STORAGE_KEYS, USER_ROLES } from '../Contexts/config';

/**
 * PrivateRoutes Component
 * Protects routes based on authentication status and user roles
 * 
 * @param {Object} props - Component props
 * @param {Array} props.allowedRoles - Array of roles allowed to access the route
 * @returns {JSX.Element} - Outlet or Navigate component
 */
const PrivateRoutes = ({ allowedRoles }) => {
    const { authState } = useAuth();
    const location = useLocation();
    
    // Check if token exists but user is not authenticated in state
    // This can happen if the app is refreshed and the auth state is not yet restored
    useEffect(() => {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (accessToken && !authState.isAuthenticated) {
            // The token exists but auth state doesn't reflect it
            // This will be handled by the AuthContext's initialization
            console.log('Token exists but user not authenticated in state');
        }
    }, [authState.isAuthenticated]);
    
    // Check if user is authenticated
    if (!authState.isAuthenticated) {
        // Redirect to login with the current location for redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Admin users can access all routes
    if (authState.isAdmin) {
        return <Outlet />;
    }
    
    // Check if user has the required role
    if (allowedRoles && !allowedRoles.includes(authState.userType)) {
        // If user is authenticated but doesn't have the required role,
        // redirect to appropriate dashboard based on their role
        if (authState.userType === USER_ROLES.CUSTOMER) {
            return <Navigate to="/customer/dashboard" replace />;
        } else if (authState.userType === USER_ROLES.VENDOR) {
            return <Navigate to="/vendor/dashboard" replace />;
        } else {
            // If user has no recognized role, redirect to home
            return <Navigate to="/" replace />;
        }
    }
    
    // If user is authenticated and has the required role, render the protected route
    return <Outlet />;
};

export default PrivateRoutes;

