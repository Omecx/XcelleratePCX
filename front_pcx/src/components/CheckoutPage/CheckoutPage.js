/**
 * CheckoutPage.js
 * Displays the shopping cart and checkout options
 */
import { Link, useNavigate } from 'react-router-dom';
import './CheckoutPage.css';
import { faTimesCircle, faArrowLeft, faCreditCard, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCart } from '../../Contexts/CartContext';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../Contexts/AuthContext';
import { useApiData } from '../../Contexts/ApiDataContext';

/**
 * CheckoutPage Component
 * Displays the user's cart items and provides checkout functionality
 */
const CheckoutPage = () => {
    const { 
        items, 
        totalItems, 
        totalPrice, 
        removeFromCart, 
        clearCart, 
        loading: cartLoading 
    } = useCart();
    
    const { user, isAuthenticated } = useAuth();
    const { fetchData } = useApiData();
    const navigate = useNavigate();
    
    const [processingPayment, setProcessingPayment] = useState(false);
    const [error, setError] = useState(null);
    const [orderProcessing, setOrderProcessing] = useState(false);
    
    // Handle continue shopping action
    const handleContinueShopping = useCallback(() => {
        navigate('/products');
    }, [navigate]);
    
    // Handle payment process
    const handlePayment = useCallback(async () => {
        if (items.length === 0) return;
        
        try {
            setProcessingPayment(true);
            setError(null);
            
            // Check if user is authenticated
            if (!isAuthenticated) {
                navigate('/login', { state: { from: '/checkout' } });
                return;
            }
            
            // Create order items array
            const orderItems = items.map(item => ({
                product: item.product.id,
                quantity: item.quantity || 1,
                price: item.product.price
            }));
            
            // Create order
            const response = await fetchData('/orders/', 'POST', {
                customer: user.id,
                order_items: orderItems,
                order_time: new Date().toISOString(),
                shipping_address: null, // This would be selected during checkout
                payment_method: 'credit_card', // This would be selected during checkout
                order_status: 'pending'
            });
            
            // Clear cart after successful order
            clearCart();
            
            // Navigate to order confirmation page
            navigate(`/order/${response.data.id}`, { 
                state: { 
                    orderDetails: response.data,
                    success: true 
                } 
            });
        } catch (err) {
            setError('Failed to process payment. Please try again.');
            console.error('Error processing payment:', err);
        } finally {
            setProcessingPayment(false);
        }
    }, [items, navigate, isAuthenticated, fetchData, user, clearCart]);
    
    // Handle remove item from cart
    const handleRemoveItem = useCallback(async (productId) => {
        try {
            setOrderProcessing(true);
            
            // If user is authenticated, also remove from server cart
            if (isAuthenticated && user) {
                // In a real app, you would have an endpoint to remove items from cart
                await fetchData(`/cart/${user.id}/item/${productId}/`, 'DELETE');
            }
            
            // Remove from local cart
            removeFromCart(productId);
        } catch (err) {
            console.error('Error removing item from cart:', err);
            // Still remove from local cart even if server request fails
            removeFromCart(productId);
        } finally {
            setOrderProcessing(false);
        }
    }, [removeFromCart, isAuthenticated, user, fetchData]);
    
    // Show loading state
    if (cartLoading || orderProcessing) {
        return (
            <div className="checkout-cont loading-container">
                <div className="loading-spinner">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Loading cart items...</span>
                </div>
            </div>
        );
    }
    
    // Show error state
    if (error) {
        return (
            <div className="checkout-cont error-container">
                <div className="error-message">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                    <button 
                        className="continue-shopping-btn"
                        onClick={handleContinueShopping}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Return to Shopping
                    </button>
                </div>
            </div>
        );
    }
    
    // Show empty cart
    if (items.length === 0) {
        return (
            <div className="checkout-cont empty-cart">
                <h3 className="header">Your Cart is Empty</h3>
                <p>You have no items in your shopping cart.</p>
                <button 
                    className="continue-shopping-btn"
                    onClick={handleContinueShopping}
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Continue Shopping
                </button>
            </div>
        );
    }

    return (
        <main className="checkout-cont" aria-label="Shopping Cart">
            <h2 className="header">Your Shopping Cart ({totalItems} items)</h2>
            
            <div className="checkout-table">
                <table className="tbl-content" aria-label="Cart items">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Product</th>
                            <th scope="col">Price</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">Subtotal</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={item.product.id}>
                                <td>{idx + 1}</td>
                                <td>
                                    <Link 
                                        to={`/product/${item.product.title}/${item.product.id}`} 
                                        className="no-underline-links product-link"
                                    >
                                        <div className="pd-card">
                                            <img 
                                                src={item.product.image || item.product.thumbnail} 
                                                alt={item.product.title} 
                                            />
                                            <h4>{item.product.title}</h4>
                                        </div>
                                    </Link>
                                </td>
                                <td className="price-cell">${item.product.price.toFixed(2)}</td>
                                <td className="quantity-cell">{item.quantity || 1}</td>
                                <td className="subtotal-cell">
                                    ${(item.product.price * (item.quantity || 1)).toFixed(2)}
                                </td>
                                <td>
                                    <button 
                                        className="remove-item-btn" 
                                        type="button" 
                                        onClick={() => handleRemoveItem(item.product.id)}
                                        aria-label={`Remove ${item.product.title} from cart`}
                                        disabled={orderProcessing}
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} className="remove-icon" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        <tr className="total-row">
                            <td colSpan={4} className="total-label">Total</td>
                            <td colSpan={2} className="total-amount">${totalPrice.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div className="btn-cont">
                    <button 
                        className="continue-shopping-btn"
                        onClick={handleContinueShopping}
                        aria-label="Continue shopping"
                        disabled={processingPayment}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Continue Shopping
                    </button>
                    
                    <button 
                        className="proceed-payment-btn"
                        onClick={handlePayment}
                        disabled={processingPayment}
                        aria-busy={processingPayment}
                        aria-label="Proceed to payment"
                    >
                        {processingPayment ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                Processing...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCreditCard} />
                                Proceed to Payment
                            </>
                        )}
                    </button>
                </div>
            </div>
        </main>
    );
};

export default CheckoutPage;