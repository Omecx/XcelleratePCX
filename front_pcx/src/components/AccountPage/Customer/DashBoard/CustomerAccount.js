/**
 * CustomerAccount.js
 * Customer dashboard displaying account summary and statistics
 */
import './CustomerAccount.css'
import { Link } from 'react-router-dom';
import Sidebar from '../../SideBar/SideBar';
import { useToggleContext } from '../../../../Contexts/ToggleContext';
import { useAuth } from '../../../../Contexts/AuthContext';
import { useWishlist } from '../../../../Contexts/WishlistContext';
import { useCart } from '../../../../Contexts/CartContext';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSpinner, 
    faShoppingBag, 
    faHeart, 
    faMapMarkerAlt, 
    faUser,
    faExclamationTriangle,
    faHistory,
    faShoppingCart
} from '@fortawesome/free-solid-svg-icons';
import { customerAPI } from '../../../../services/api';
import { MenuData } from './CustomerMenuData';

/**
 * CustomerDashBoard Component
 * Main dashboard for customer account showing summary statistics
 */
const CustomerDashBoard = () => {
    const { isToggled } = useToggleContext();
    const { authState } = useAuth();
    const { items: wishlistItems } = useWishlist();
    const { items: cartItems } = useCart();
    
    const [dashboardStats, setDashboardStats] = useState({
        totalOrders: 0,
        totalWishlistItems: 0,
        addresses: 0,
        recentOrders: [],
        recentWishlist: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch dashboard data
    useEffect(() => {
        const getDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                if (!authState.isAuthenticated || !authState.customerId) {
                    throw new Error('Authentication required');
                }
                
                // Get dashboard data from API
                const response = await customerAPI.getDashboard(authState.customerId);
                
                setDashboardStats({
                    totalOrders: response.data.total_orders,
                    totalWishlistItems: response.data.total_wishlist_items,
                    addresses: response.data.total_addresses,
                    recentOrders: response.data.recent_orders || [],
                    recentWishlist: response.data.recent_wishlist || []
                });
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                
                // Provide more specific error messages based on the error type
                let errorMessage = 'Failed to load dashboard data';
                
                if (error.response) {
                    // The request was made and the server responded with a status code
                    if (error.response.status === 404) {
                        errorMessage = 'Customer data not found. Please try again later.';
                    } else if (error.response.status === 401) {
                        errorMessage = 'Authentication required. Please log in again.';
                    } else {
                        errorMessage = error.response.data?.message || 
                                    error.response.data?.msg || 
                                    error.response.data?.error ||
                                    `Error ${error.response.status}: Failed to load dashboard data`;
                    }
                } else if (error.message === 'Network Error') {
                    errorMessage = 'Network error. Please check your internet connection.';
                } else {
                    errorMessage = error.message || 'Failed to load dashboard data';
                }
                
                setError(errorMessage);
                setLoading(false);
                
                // Set default values if data fetch fails
                setDashboardStats({
                    totalOrders: 0,
                    totalWishlistItems: wishlistItems.length,
                    addresses: 0,
                    recentOrders: [],
                    recentWishlist: []
                });
            }
        };
        
        if (authState.isAuthenticated) {
            getDashboardData();
        }
    }, [authState.isAuthenticated, authState.customerId, wishlistItems.length]);
    
    // Render loading state
    if (loading) {
        return (
            <div className="account-page-cont loading-container">
                <header className="header">
                    <h1>Dashboard</h1>
                </header>
                <div className="loading-spinner">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Loading your dashboard...</span>
                </div>
            </div>
        );
    }
    
    // Render error state
    if (error) {
        return (
            <div className="account-page-cont error-container">
                <header className="header">
                    <h1>Dashboard</h1>
                </header>
                <div className="error-message">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                    <button 
                        className="retry-btn" 
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="account-page-cont">
            <header className="header">
                <h1>Customer Dashboard</h1>
                {authState.user && <p className="welcome-message">Welcome back, {authState.user}!</p>}
            </header>
            <div className={`menu-content-wrap ${isToggled ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-container">
                    <Sidebar MenuData={MenuData}/>
                </div>
                <div className="main-content">
                    <main className="ds-main" aria-label="Customer dashboard summary">
                        <div className="card-ds">
                            <Link className="no-underline-links" to="/customer/orders" aria-label="View your orders">
                                {isToggled && (
                                  <>
                                    <FontAwesomeIcon icon={faShoppingBag} className="dashboard-icon" />
                                    <h2 className="ds-account">Total Orders</h2>
                                    <p className="ds-content">{dashboardStats.totalOrders}</p>
                                  </>
                                )}
                            </Link>     
                        </div>
                        <div className="card-ds">
                            <Link className="no-underline-links" to="/customer/wishlist" aria-label="View your wishlist">
                                {isToggled && (
                                  <>
                                    <FontAwesomeIcon icon={faHeart} className="dashboard-icon" />
                                    <h2 className="ds-account">Wishlist Items</h2>
                                    <p className="ds-content">{dashboardStats.totalWishlistItems}</p>
                                  </>
                                )}
                            </Link>     
                        </div>
                        <div className="card-ds">
                            <Link className="no-underline-links" to="/customer/addresses" aria-label="View your addresses">
                                {isToggled && (
                                  <>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="dashboard-icon" />
                                    <h2 className="ds-account">Saved Addresses</h2>
                                    <p className="ds-content">{dashboardStats.addresses}</p>
                                  </>
                                )}
                            </Link>     
                        </div>
                        
                        {isToggled && (
                            <>
                                <div className="card-ds card-ds-wide">
                                    <h2 className="ds-account">
                                        <FontAwesomeIcon icon={faHistory} className="section-icon" />
                                        Recent Activity
                                    </h2>
                                    {dashboardStats.recentOrders.length > 0 ? (
                                        <table className="recent-orders-table">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Order ID</th>
                                                    <th scope="col">Date</th>
                                                    <th scope="col">Items</th>
                                                    <th scope="col">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboardStats.recentOrders.map((order, index) => (
                                                    <tr key={`${order.id}-${index}`}>
                                                        <td>#{order.id}</td>
                                                        <td>{formatDate(order.date)}</td>
                                                        <td>{order.total_items}</td>
                                                        <td>${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No recent orders found.</p>
                                    )}
                                </div>
                                
                                <div className="card-ds">
                                    <h2 className="ds-account">
                                        <FontAwesomeIcon icon={faHeart} className="section-icon" />
                                        Recent Wishlist
                                    </h2>
                                    {dashboardStats.recentWishlist.length > 0 ? (
                                        <ul className="activity-list">
                                            {dashboardStats.recentWishlist.map((item, index) => (
                                                <li key={index} className="activity-item">
                                                    {item.product_name} - ${item.price ? item.price.toFixed(2) : '0.00'}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No items in wishlist.</p>
                                    )}
                                    <Link to="/customer/wishlist" className="checkout-link">View All</Link>
                                </div>
                                
                                <div className="card-ds">
                                    <h2 className="ds-account">
                                        <FontAwesomeIcon icon={faShoppingCart} className="section-icon" />
                                        Quick Actions
                                    </h2>
                                    <Link to="/shop" className="checkout-link">Browse Products</Link>
                                    <Link to="/customer/profile" className="checkout-link">Edit Profile</Link>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashBoard;