import './CustomerWishList.css';
import { Link } from 'react-router-dom';
import Sidebar from '../../SideBar/SideBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCartPlus, 
    faTimesCircle, 
    faSpinner, 
    faExclamationTriangle,
    faCheckCircle,
    faHeart
} from '@fortawesome/free-solid-svg-icons';

import { MenuData } from '../DashBoard/CustomerMenuData';
import { useToggleContext } from '../../../../Contexts/ToggleContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../../Contexts/AuthContext';
import { useWishlist } from '../../../../Contexts/WishlistContext';
import { useCart } from '../../../../Contexts/CartContext';

const CustomerWishList = () => {
    const { isAuthenticated } = useAuth();    
    const { isToggled } = useToggleContext();
    const { addToCart } = useCart();
    const { 
        items: wishlistItems, 
        removeFromWishlist, 
        loading: wishlistLoading,
        error: wishlistError,
        fetchWishlist
    } = useWishlist();
    
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);
    
    // Fetch wishlist on component mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchWishlist();
        }
    }, [isAuthenticated, fetchWishlist]);
    
    // Handle remove from wishlist
    const handleRemoveFromWishlist = async (productId) => {
        try {
            setActionInProgress(true);
            setActionMessage({ type: 'info', text: 'Removing from wishlist...' });
            
            // Use the context method to remove from wishlist
            await removeFromWishlist(productId);
            
            setActionMessage({ type: 'success', text: 'Item removed from wishlist' });
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setActionMessage(null);
            }, 3000);
        } catch (err) {
            console.error('Error removing item from wishlist:', err);
            
            let errorMessage = 'Failed to remove from wishlist';
            if (err.response) {
                errorMessage = err.response.data?.message || 
                              err.response.data?.msg || 
                              `Error ${err.response.status}: Failed to remove from wishlist`;
            } else if (err.message === 'Network Error') {
                errorMessage = 'Network error. Please check your internet connection.';
            }
            
            setActionMessage({ type: 'error', text: errorMessage });
        } finally {
            setActionInProgress(false);
        }
    };
    
    // Handle add to cart
    const handleAddToCart = (product) => {
        try {
            setActionInProgress(true);
            setActionMessage({ type: 'info', text: 'Adding to cart...' });
            
            addToCart(product);
            
            setActionMessage({ type: 'success', text: 'Item added to cart' });
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setActionMessage(null);
            }, 3000);
        } catch (err) {
            setActionMessage({ type: 'error', text: 'Failed to add to cart' });
            console.error('Error adding item to cart:', err);
        } finally {
            setActionInProgress(false);
        }
    };
    
    // Render action message
    const renderActionMessage = () => {
        if (!actionMessage) return null;
        
        const icon = actionMessage.type === 'success' ? faCheckCircle :
                    actionMessage.type === 'error' ? faExclamationTriangle :
                    faSpinner;
        
        const className = `action-message ${actionMessage.type}`;
        
        return (
            <div className={className}>
                <FontAwesomeIcon icon={icon} spin={actionMessage.type === 'info'} />
                <span>{actionMessage.text}</span>
            </div>
        );
    };
    
    // Show loading state
    if (wishlistLoading) {
        return (
            <div className="account-page-cont">
                <header className="header">
                    <h1>My Wishlist</h1>
                </header>
                <div className="menu-content-wrap">
                    <Sidebar MenuData={MenuData}/>
                    <main className="ds-main">
                        <div className="loading-container">
                            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                            <span>Loading your wishlist...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }
    
    // Show error state
    if (wishlistError && !wishlistItems.length) {
        return (
            <div className="account-page-cont">
                <header className="header">
                    <h1>My Wishlist</h1>
                </header>
                <div className="menu-content-wrap">
                    <Sidebar MenuData={MenuData}/>
                    <main className="ds-main">
                        <div className="error-container">
                            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                            <span>{wishlistError}</span>
                            <button 
                                onClick={fetchWishlist} 
                                className="retry-btn"
                            >
                                Try Again
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }
    
    return (
        <div className="wishlist-page-cont">
            <header className="header">
                <h1><FontAwesomeIcon icon={faHeart} /> My Wishlist</h1>
            </header>
            <div className="menu-content-wrap">
                <Sidebar MenuData={MenuData}/>
                <main className="ods-main">
                    {renderActionMessage()}
                    <div className="orders-table">
                        <table className='ods-tbl-content'>
                            <thead className='tb-title'>
                                <tr className='card'>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wishlistItems && wishlistItems.length > 0 ? (
                                    wishlistItems.map((item, idx) => (
                                        <tr key={idx} className='card'>
                                            <td><span className='in-title'>ID:</span>{idx + 1}</td>
                                            <td>
                                                <span className='in-title'>Product:</span>
                                                <Link to={`/product/${item.product.title}/${item.product.id}`} className='no-underline-links' id='nu-checkout'>
                                                    <div className="pd-card">
                                                        <img src={item.product.thumbnail || item.product.image} alt={item.product.title} />
                                                        <h4>{item.product.title}</h4>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td><span className='in-title'>Price:</span>${item.product.price.toFixed(2)}</td>
                                            <td>
                                                <span className='in-title'>Action:</span>
                                                <div className="action-buttons">
                                                    <button 
                                                        className='ws-action' 
                                                        type="button" 
                                                        onClick={() => handleRemoveFromWishlist(item.product.id)}
                                                        aria-label={`Remove ${item.product.title} from wishlist`}
                                                        disabled={actionInProgress}
                                                        title="Remove from wishlist"
                                                    >
                                                        <FontAwesomeIcon id="ws-del" icon={faTimesCircle} />
                                                    </button>
                                                    <button 
                                                        className='ws-action' 
                                                        type="button" 
                                                        onClick={() => handleAddToCart(item.product)}
                                                        aria-label={`Add ${item.product.title} to cart`}
                                                        disabled={actionInProgress}
                                                        title="Add to cart"
                                                    >
                                                        <FontAwesomeIcon id="ws-del" icon={faCartPlus} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="empty-wishlist-message">
                                            <FontAwesomeIcon icon={faHeart} size="2x" />
                                            <p>Your wishlist is empty</p>
                                            <Link to="/products" className="browse-products-btn">
                                                Browse Products
                                            </Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerWishList;