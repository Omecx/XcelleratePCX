/**
 * VendorProducts.js
 * Displays and manages vendor products
 */
import './VendorProducts.css';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../SideBar/SideBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEdit, 
    faPlusCircle, 
    faTimesCircle,
    faSpinner,
    faExclamationTriangle,
    faSearch,
    faEye,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { useToggleContext } from './../../../../Contexts/ToggleContext';
import { MenuData } from './../DashBoard/VendorMenuData';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './../../../../Contexts/AuthContext';
import { useApiData } from './../../../../Contexts/ApiDataContext';
import { API_BASE_URL } from '../../../../Contexts/config';

/**
 * VendorProducts Component
 * Displays and manages vendor products with CRUD operations
 */
const VendorProducts = () => {
    const { authState } = useAuth();
    const { isToggled } = useToggleContext();
    const { data, loading: apiLoading, error: apiError, setResource, deleteItem } = useApiData();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);
    const [filteredProducts, setFilteredProducts] = useState([]);
    
    // Fetch products
    useEffect(() => {
        setResource('products');
    }, [setResource]);
    
    // Update local state when API data changes
    useEffect(() => {
        if (!apiLoading) {
            setLoading(false);
        }
        
        if (apiError) {
            setError(apiError);
        }
        
        // Format products for display
        if (data) {
            const formattedProducts = data.map(product => ({
                id: product.id,
                title: product.title,
                thumbnail: product.thumbnail,
                details: product.detail,
                price: product.price,
                stock: product.stock || 0,
                category: product.category?.title || 'Uncategorized'
            }));
            
            setFilteredProducts(formattedProducts);
        }
    }, [apiLoading, apiError, data]);
    
    // Filter products based on search term
    useEffect(() => {
        if (data) {
            const filtered = data.filter(product => 
                product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.category?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            const formattedProducts = filtered.map(product => ({
                id: product.id,
                title: product.title,
                thumbnail: product.thumbnail,
                details: product.detail,
                price: product.price,
                stock: product.stock || 0,
                category: product.category?.title || 'Uncategorized'
            }));
            
            setFilteredProducts(formattedProducts);
        }
    }, [searchTerm, data]);
    
    // Handle delete product
    const handleDeleteProduct = useCallback(async (productId) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                setActionInProgress(true);
                setActionMessage({ type: 'info', text: 'Deleting product...' });
                
                // Delete the product using the API
                await deleteItem(productId);
                
                setActionMessage({ type: 'success', text: 'Product deleted successfully' });
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setActionMessage(null);
                }, 3000);
            } catch (err) {
                setActionMessage({ type: 'error', text: 'Failed to delete product' });
                console.error('Error deleting product:', err);
            } finally {
                setActionInProgress(false);
            }
        }
    }, [deleteItem]);
    
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
    
    return (
        <div className="vendor-products-container">
            <div className={`sidebar ${isToggled ? 'active' : ''}`}>
                <Sidebar MenuData={MenuData} />
            </div>
            
            <div className="vendor-products-content">
                <div className="products-header">
                    <h2>My Products</h2>
                    
                    <div className="products-actions">
                        <div className="search-container">
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        
                        <Link to="/vendor/products/add_new" className="add-product-btn">
                            <FontAwesomeIcon icon={faPlusCircle} />
                            <span>Add New Product</span>
                        </Link>
                    </div>
                </div>
                
                {renderActionMessage()}
                
                {loading ? (
                    <div className="loading-container">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <p>Loading products...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <p>{error}</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="product-card">
                                <div className="product-thumbnail">
                                    <img 
                                        src={product.thumbnail ? `${API_BASE_URL}${product.thumbnail}` : '/placeholder.jpg'} 
                                        alt={product.title} 
                                    />
                                </div>
                                
                                <div className="product-details">
                                    <h3>{product.title}</h3>
                                    <p className="product-category">{product.category}</p>
                                    <p className="product-price">${product.price}</p>
                                </div>
                                
                                <div className="product-actions">
                                    <button 
                                        className="view-btn"
                                        onClick={() => window.open(`/product/${product.id}`, '_blank')}
                                        disabled={actionInProgress}
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>View</span>
                                    </button>
                                    
                                    <button 
                                        className="edit-btn"
                                        onClick={() => navigate(`/vendor/products/edit/${product.id}`)}
                                        disabled={actionInProgress}
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                        <span>Edit</span>
                                    </button>
                                    
                                    <button 
                                        className="delete-btn"
                                        onClick={() => handleDeleteProduct(product.id)}
                                        disabled={actionInProgress}
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-products">
                        {searchTerm ? (
                            <p>No products match your search criteria.</p>
                        ) : (
                            <>
                                <p>You don't have any products yet.</p>
                                <Link to="/vendor/products/add_new" className="add-product-btn">
                                    <FontAwesomeIcon icon={faPlusCircle} />
                                    <span>Add New Product</span>
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorProducts;
