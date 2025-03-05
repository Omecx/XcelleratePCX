// import { Link } from 'react-router-dom';

import { useEffect, useState } from "react";
import { useApiData } from "../../../../Contexts/ApiDataContext";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faCheckCircle, faMapMarkerAlt, faEdit } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../../SideBar/SideBar';
import { MenuData } from '../../Customer/DashBoard/CustomerMenuData';
import '../../../../components/common/FormStyles.css';
import './CustomerAddresses.css';
import { useAuth } from "../../../../Contexts/AuthContext";

const EditAddress = () => {
    const { authState } = useAuth();
    const navigate = useNavigate();
    const { data, loading, error, updateItem, setResource, fetchResourceData } = useApiData();
    const [updatedItem, setUpdatedItem] = useState({ 
        address: '', 
        default_address: false,
        customer: null
    });
    const [actionMessage, setActionMessage] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [addressFound, setAddressFound] = useState(true);
    
    const { address_id } = useParams();

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                // Get customer ID from auth state or localStorage
                const customerId = authState?.customerId || localStorage.getItem('customer_id');
                
                if (!customerId) {
                    setActionMessage({ 
                        type: 'error', 
                        text: 'Customer ID not found. Please log in again.' 
                    });
                    setAddressFound(false);
                    return;
                }
                
                setResource('address');
                await fetchResourceData('address');
            } catch (err) {
                console.error('Error fetching address:', err);
                setActionMessage({ 
                    type: 'error', 
                    text: err.message || 'Failed to load address data' 
                });
                setAddressFound(false);
            }
        };
        
        fetchAddress();
    }, [setResource, fetchResourceData, authState]);

    useEffect(() => {
        if (data && Array.isArray(data)) {
            const existingAddress = data.find((item) => item.id === parseInt(address_id));
            if (existingAddress) {
                setUpdatedItem({
                    address: existingAddress.address,
                    default_address: existingAddress.default_address || false,
                    customer: existingAddress.customer
                });
                setAddressFound(true);
            } else {
                setAddressFound(false);
                setActionMessage({ type: 'error', text: 'Address not found' });
            }
        }
    }, [data, address_id]);

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        
        if (!updatedItem.address.trim()) {
            setActionMessage({ type: 'error', text: 'Please enter an address' });
            return;
        }
        
        if (!updatedItem.customer) {
            setActionMessage({ 
                type: 'error', 
                text: 'Customer ID not found. Please log in again.' 
            });
            return;
        }
        
        try {
            setActionInProgress(true);
            setActionMessage({ type: 'info', text: 'Updating address...' });
            
            // Only send necessary fields to the API
            const dataToUpdate = {
                address: updatedItem.address,
                default_address: updatedItem.default_address
            };
            
            await updateItem(address_id, dataToUpdate);
            
            setActionMessage({ type: 'success', text: 'Address updated successfully' });
            
            // Navigate after successful update
            setTimeout(() => {
                navigate('/customer/addresses');
            }, 1500);
        } catch (err) {
            console.error('Error updating address:', err);
            setActionMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to update address. Please try again.' 
            });
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

    return (
        <div className="customer-account-container">
            <Sidebar MenuData={MenuData} />
            
            <div className="customer-account-content">
                <div className="form-container">
                    <div className="form-header">
                        <h2><FontAwesomeIcon icon={faEdit} /> Edit Address</h2>
                        <p>Update your shipping address details</p>
                    </div>
                    
                    {renderActionMessage()}
                    
                    {loading && !actionInProgress ? (
                        <div className="loading-message">
                            <FontAwesomeIcon icon={faSpinner} spin />
                            <span>Loading address data...</span>
                        </div>
                    ) : error && !actionMessage ? (
                        <div className="error-message">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>{error}</span>
                            <button 
                                className="submit-btn" 
                                onClick={() => window.location.reload()}
                                style={{ marginTop: '10px' }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : !addressFound ? (
                        <div className="error-message">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>Address not found. Please go back and try again.</span>
                            <button 
                                className="submit-btn" 
                                onClick={() => navigate('/customer/addresses')}
                                style={{ marginTop: '10px' }}
                            >
                                Back to Addresses
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateItem} className="form-content">
                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <textarea 
                                    id="address" 
                                    name="address" 
                                    value={updatedItem.address}
                                    onChange={(e) => setUpdatedItem({ ...updatedItem, address: e.target.value })}
                                    placeholder="Enter your full address"
                                    required
                                />
                            </div>
                            
                            <div className="checkbox-container">
                                <input 
                                    type="checkbox" 
                                    id="default_address"
                                    checked={updatedItem.default_address} 
                                    onChange={(e) => setUpdatedItem({ ...updatedItem, default_address: e.target.checked})}
                                />
                                <label htmlFor="default_address">Set as Default Address</label>
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="submit-btn"
                                    disabled={actionInProgress || !updatedItem.customer}
                                >
                                    {actionInProgress ? 'Updating...' : 'Update Address'}
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => navigate('/customer/addresses')}
                                    disabled={actionInProgress}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditAddress;