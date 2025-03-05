/**
 * CustomerOrdersPage.js
 * Displays the customer's order history
 */
import './CustomerOrdersPage.css';
import { Link } from 'react-router-dom';
import Sidebar from '../../SideBar/SideBar';
import { useToggleContext } from '../../../../Contexts/ToggleContext';
import { MenuData } from '../DashBoard/CustomerMenuData';
import { useApiData } from '../../../../Contexts/ApiDataContext';
import { useAuth } from '../../../../Contexts/AuthContext';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

/**
 * CustomerOrdersPage Component
 * Displays the customer's order history with status and details
 */
const CustomerOrdersPage = () => {
    const { isToggled } = useToggleContext();
    const { userId } = useAuth();
    const { fetchData } = useApiData();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch orders data
    useEffect(() => {
        const getOrders = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // In a real app, this would fetch from an API endpoint
                // const response = await fetchData(`/orders/user/${userId}`);
                // setOrders(response.data);
                
                // For now, using mock data
                // Simulate API delay
                setTimeout(() => {
                    setOrders([
                        {
                            id: 1,
                            title: "Smartphone XYZ",
                            price: "599.99",
                            image: "https://via.placeholder.com/50",
                            time: "2023-10-15 11:00",
                            status: "Delivered",
                            details: "Order was delivered successfully to the specified address."
                        },
                        {           
                            id: 2,
                            title: "Laptop Pro",
                            price: "1299.99",
                            image: "https://via.placeholder.com/50",
                            time: "2023-10-10 15:30",
                            status: "Shipped",
                            details: "Order has been shipped and is on the way to your location."
                        },
                        {           
                            id: 3,
                            title: "Wireless Headphones",
                            price: "149.99",
                            image: "https://via.placeholder.com/50",
                            time: "2023-09-28 09:45",
                            status: "Delivered",
                            details: "Order was delivered successfully to the specified address."
                        },
                    ]);
                    setLoading(false);
                }, 800);
            } catch (err) {
                setError('Failed to load orders. Please try again later.');
                setLoading(false);
                console.error('Error fetching orders:', err);
            }
        };
        
        getOrders();
    }, [userId, fetchData]);
    
    // Render loading state
    if (loading) {
        return (
            <div className="order-page-cont loading-container">
                <header className="header">
                    <h1>Orders</h1>
                </header>
                <div className="loading-spinner">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Loading your orders...</span>
                </div>
            </div>
        );
    }
    
    // Render error state
    if (error) {
        return (
            <div className="order-page-cont error-container">
                <header className="header">
                    <h1>Orders</h1>
                </header>
                <div className="error-message">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="order-page-cont">
            <header className="header">
                <h1>Your Orders</h1>
            </header>
            <div className="menu-content-wrap">
                <Sidebar MenuData={MenuData} />
                <main className="ods-main" aria-label="Orders history">
                    {isToggled ? (
                        <div className="orders-table">
                            {orders.length === 0 ? (
                                <div className="no-orders-message">
                                    <p>You haven't placed any orders yet.</p>
                                    <Link to="/products" className="shop-now-link">
                                        Shop Now
                                    </Link>
                                </div>
                            ) : (
                                <table className="ods-tbl-content">
                                    <thead className="tb-title">
                                        <tr className="card">
                                            <th scope="col">Order #</th>
                                            <th scope="col">Order Details</th>
                                            <th scope="col">Total Price</th>
                                            <th scope="col">Date & Time</th>
                                            <th scope="col">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} className="card">
                                                <td>
                                                    <h6 className="in-title">Order ID:</h6>
                                                    {order.id}
                                                </td>
                                                <td>
                                                    <Link 
                                                        to={`/order/${order.id}`} 
                                                        className="no-underline-links" 
                                                        id="nu-checkout"
                                                        aria-label={`View details for order ${order.id}`}
                                                    >
                                                        <div className="pd-card">
                                                            <img src={order.image} alt={order.title} />
                                                            <h4>{order.title}</h4>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td>
                                                    <h6 className="in-title">Price:</h6>
                                                    ${order.price}
                                                </td>
                                                <td>
                                                    <h6 className="in-title">Date:</h6>
                                                    {order.time}
                                                </td>
                                                <td>
                                                    <h6 className="in-title">Status:</h6>
                                                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    );
};

export default CustomerOrdersPage;