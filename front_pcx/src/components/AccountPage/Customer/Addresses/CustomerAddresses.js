/**
 * CustomerAddresses.js
 * Manages customer shipping addresses
 */
import './CustomerAddresses.css';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../SideBar/SideBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEdit, 
    faPlusCircle, 
    faTimesCircle, 
    faSpinner, 
    faExclamationTriangle,
    faCheckCircle,
    faHome
} from '@fortawesome/free-solid-svg-icons';
import { useToggleContext } from './../../../../Contexts/ToggleContext';
import { MenuData } from '../DashBoard/CustomerMenuData';
import { useApiData } from '../../../../Contexts/ApiDataContext';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../Contexts/AuthContext';

/**
 * CustomerAddresses Component
 * Displays and manages customer shipping addresses
 */
const CustomerAddresses = () => {
    const { authState } = useAuth();
    const { isToggled } = useToggleContext();
    const { data, loading: apiLoading, error: apiError, setResource, fetchResourceData, deleteItem, updateItem } = useApiData();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);
    
    // Fetch addresses
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get customer ID from auth state or localStorage
                const customerId = authState?.customerId || localStorage.getItem('customer_id');
                
                if (!customerId) {
                    setError('Customer ID not found. Please log in again.');
                    setLoading(false);
                    return;
                }
                
                setResource('address');
                
                // Manually fetch addresses with customer ID
                await fetchResourceData('address');
            } catch (err) {
                console.error('Error fetching addresses:', err);
                setError(err.message || 'Failed to load addresses');
            } finally {
                setLoading(false);
            }
        };
        
        fetchAddresses();
    }, [setResource, fetchResourceData, authState]);
    
    // Update local state when API data changes
    useEffect(() => {
        if (!apiLoading) {
            setLoading(false);
        }
        
        if (apiError) {
            setError(apiError);
        }
    }, [apiLoading, apiError, data]);
    
    // Handle delete address
    const handleDelete = useCallback(async (addressId) => {
        if (window.confirm("Are you sure you want to delete this address?")) {
            try {
                setActionInProgress(true);
                setActionMessage({ type: 'info', text: 'Deleting address...' });
                
                // Delete the address using the API
                await deleteItem(addressId);
                
                setActionMessage({ type: 'success', text: 'Address deleted successfully' });
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setActionMessage(null);
                }, 3000);
            } catch (err) {
                console.error('Error deleting address:', err);
                setActionMessage({ 
                    type: 'error', 
                    text: err.response?.data?.message || 'Failed to delete address. Please try again.' 
                });
            } finally {
                setActionInProgress(false);
            }
        }
    }, [deleteItem]);
    
    // Handle set default address
    const handleSetDefault = useCallback(async (addressId) => {
        try {
            setActionInProgress(true);
            setActionMessage({ type: 'info', text: 'Updating default address...' });
            
            // Find the address to update
            const addressToUpdate = data.find(addr => addr.id === addressId);
            
            if (addressToUpdate) {
                // Update the address to be default
                await updateItem(addressId, {
                    ...addressToUpdate,
                    default_address: true
                });
                
                setActionMessage({ type: 'success', text: 'Default address updated' });
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setActionMessage(null);
                }, 3000);
            }
        } catch (err) {
            console.error('Error updating default address:', err);
            setActionMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to update default address. Please try again.' 
            });
        } finally {
            setActionInProgress(false);
        }
    }, [data, updateItem]);
    
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
        <div className="customer-account-container">
            <div className={`sidebar ${isToggled ? 'active' : ''}`}>
                <Sidebar MenuData={MenuData} />
            </div>
            
            <div className="customer-account-content">
                <div className="addresses-header">
                    <h2>My Addresses</h2>
                    <Link to="/customer/address/add_new" className="add-address-btn">
                        <FontAwesomeIcon icon={faPlusCircle} />
                        <span>Add New Address</span>
                    </Link>
                </div>
                
                {renderActionMessage()}
                
                {loading ? (
                    <div className="loading-container">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <p>Loading addresses...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <p>{error}</p>
                        <button 
                            className="submit-btn" 
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                ) : data && data.length > 0 ? (
                    <div className="addresses-grid">
                        {data.map(address => (
                            <div key={address.id} className={`address-card ${address.default_address ? 'default' : ''}`}>
                                {address.default_address && (
                                    <div className="default-badge">
                                        <FontAwesomeIcon icon={faHome} />
                                        <span>Default</span>
                                    </div>
                                )}
                                
                                <div className="address-content">
                                    <p>{address.address}</p>
                                </div>
                                
                                <div className="address-actions">
                                    <button 
                                        className="edit-btn"
                                        onClick={() => navigate(`/customer/address/edit/${address.id}`)}
                                        disabled={actionInProgress}
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                        <span>Edit</span>
                                    </button>
                                    
                                    {!address.default_address && (
                                        <button 
                                            className="default-btn"
                                            onClick={() => handleSetDefault(address.id)}
                                            disabled={actionInProgress}
                                        >
                                            <FontAwesomeIcon icon={faHome} />
                                            <span>Set as Default</span>
                                        </button>
                                    )}
                                    
                                    <button 
                                        className="delete-btn"
                                        onClick={() => handleDelete(address.id)}
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
                    <div className="no-addresses">
                        <p>You don't have any saved addresses yet.</p>
                        <Link to="/customer/address/add_new" className="add-address-btn">
                            <FontAwesomeIcon icon={faPlusCircle} />
                            <span>Add New Address</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerAddresses;