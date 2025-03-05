/**
 * VendorAccount.js
 * Vendor dashboard displaying account summary and statistics
 */
import './VendorAccount.css'
import { Link } from 'react-router-dom';
import SideBar from '../../SideBar/SideBar';
import { MenuData }  from './VendorMenuData';
import { useToggleContext } from '../../../../Contexts/ToggleContext';
import { useAuth } from '../../../../Contexts/AuthContext';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSpinner, 
    faShoppingBag, 
    faUsers, 
    faBoxes, 
    faChartLine,
    faExclamationTriangle,
    faHistory,
    faAward
} from '@fortawesome/free-solid-svg-icons';
import { vendorAPI } from '../../../../services/api';

/**
 * VendorAccountPage Component
 * Main dashboard for vendor account showing summary statistics
 */
const VendorAccountPage = () => {
    const { isToggled } = useToggleContext();
    const { authState } = useAuth();
    
    const [dashboardStats, setDashboardStats] = useState({
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        totalRevenue: 0,
        recentOrders: [],
        topProducts: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch dashboard data
    useEffect(() => {
        const getDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                if (!authState.isAuthenticated || !authState.vendorId) {
                    throw new Error('Authentication required as vendor');
                }
                
                // Get dashboard data from API
                const response = await vendorAPI.getDashboard(authState.vendorId);
                
                // Set dashboard data
                setDashboardStats({
                    totalOrders: response.data.total_orders,
                    totalCustomers: response.data.total_orders > 0 ? Math.ceil(response.data.total_orders * 0.8) : 0, // Estimate unique customers
                    totalProducts: response.data.total_products,
                    totalRevenue: response.data.total_revenue,
                    recentOrders: response.data.recent_orders.map(order => ({
                        id: order.order_id,
                        product: order.product,
                        amount: order.amount,
                        date: order.date,
                        quantity: order.quantity,
                        status: order.quantity > 2 ? 'Processing' : 'Delivered' // Mock status based on quantity
                    })),
                    topProducts: response.data.top_products
                });
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                
                // Provide more specific error messages based on the error type
                let errorMessage = 'Failed to load dashboard data';
                
                if (error.response) {
                    // The request was made and the server responded with a status code
                    if (error.response.status === 404) {
                        errorMessage = 'Vendor data not found. Please try again later.';
                    } else if (error.response.status === 401) {
                        errorMessage = 'Authentication required. Please log in again.';
                    } else if (error.response.status === 403) {
                        errorMessage = 'You do not have permission to view this dashboard.';
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
                    totalCustomers: 0,
                    totalProducts: 0,
                    totalRevenue: 0,
                    recentOrders: [],
                    topProducts: []
                });
            }
        };
        
        if (authState.isAuthenticated && authState.userType === 'vendor') {
            getDashboardData();
        } else {
            setError('You must be logged in as a vendor to view this page');
            setLoading(false);
        }
    }, [authState.isAuthenticated, authState.userType, authState.vendorId]);
    
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
                <h1>Vendor Dashboard</h1>
                {authState.user && <p className="welcome-message">Welcome back, {authState.user}!</p>}
            </header>
            <div className={`menu-content-wrap ${isToggled ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-container">
                    <SideBar MenuData={MenuData}/>
                </div>
                <div className="main-content">
                    <main className="vendor-main" aria-label="Vendor dashboard summary">
                        <div className="card-ds">
                            <Link className="no-underline-links" to="/vendor/orders" aria-label="View your orders">
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
                            <Link className="no-underline-links" to="/vendor/customers" aria-label="View your customers">
                                {isToggled && (
                                  <>
                                    <FontAwesomeIcon icon={faUsers} className="dashboard-icon" />
                                    <h2 className="ds-account">Total Customers</h2>
                                    <p className="ds-content">{dashboardStats.totalCustomers}</p>
                                  </>
                                )}
                            </Link>     
                        </div>
                        <div className="card-ds">
                            <Link className="no-underline-links" to="/vendor/products" aria-label="View your products">
                                {isToggled && (
                                  <>
                                    <FontAwesomeIcon icon={faBoxes} className="dashboard-icon" />
                                    <h2 className="ds-account">Total Products</h2>
                                    <p className="ds-content">{dashboardStats.totalProducts}</p>
                                  </>
                                )}
                            </Link>     
                        </div>
                        <div className="card-ds">
                            <Link className="no-underline-links" to="/vendor/analytics" aria-label="View your analytics">
                                {isToggled && (
                                  <>
                                    <FontAwesomeIcon icon={faChartLine} className="dashboard-icon" />
                                    <h2 className="ds-account">Total Revenue</h2>
                                    <p className="ds-content">${dashboardStats.totalRevenue ? dashboardStats.totalRevenue.toFixed(2) : '0.00'}</p>
                                  </>
                                )}
                            </Link>     
                        </div>
                        
                        {isToggled && (
                            <>
                                <div className="card-ds card-ds-wide">
                                    <h2 className="ds-account">
                                        <FontAwesomeIcon icon={faHistory} className="section-icon" />
                                        Recent Orders
                                    </h2>
                                    {dashboardStats.recentOrders.length > 0 ? (
                                        <table className="recent-orders-table">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Order ID</th>
                                                    <th scope="col">Product</th>
                                                    <th scope="col">Quantity</th>
                                                    <th scope="col">Amount</th>
                                                    <th scope="col">Date</th>
                                                    <th scope="col">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboardStats.recentOrders.map((order, index) => (
                                                    <tr key={`${order.id}-${index}`}>
                                                        <td>#{order.id}</td>
                                                        <td>{order.product}</td>
                                                        <td>{order.quantity}</td>
                                                        <td>${order.amount ? order.amount.toFixed(2) : '0.00'}</td>
                                                        <td>{formatDate(order.date)}</td>
                                                        <td>
                                                            <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No recent orders found.</p>
                                    )}
                                </div>
                                
                                <div className="card-ds card-ds-wide">
                                    <h2 className="ds-account">
                                        <FontAwesomeIcon icon={faAward} className="section-icon" />
                                        Top Products
                                    </h2>
                                    {dashboardStats.topProducts.length > 0 ? (
                                        <table className="top-products-table">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Product</th>
                                                    <th scope="col">Orders</th>
                                                    <th scope="col">Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboardStats.topProducts.map((product, index) => (
                                                    <tr key={index}>
                                                        <td>{product.name}</td>
                                                        <td>{product.orders}</td>
                                                        <td>${product.revenue ? product.revenue.toFixed(2) : '0.00'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No product data available.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default VendorAccountPage;