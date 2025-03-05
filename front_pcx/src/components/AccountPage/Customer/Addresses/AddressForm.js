// import { Link } from 'react-router-dom';

import { useEffect, useState } from "react";
import { useApiData } from "../../../../Contexts/ApiDataContext";
import { useAuth } from "../../../../Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faCheckCircle, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../../SideBar/SideBar';
import { MenuData } from '../../Customer/DashBoard/CustomerMenuData';
import '../../../../components/common/FormStyles.css';
import './CustomerAddresses.css';

const AddAddress = () => {
    const { authState } = useAuth();
    const navigate = useNavigate();
    const { createItem, resource, setResource, loading, error } = useApiData();
    const [newItem, setNewItem] = useState({
        'address': '',
        'customer': null, 
        'default_address': false
    });
    const [actionMessage, setActionMessage] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);

    useEffect(() => {
        setResource('address');
        
        // Set customer ID from auth state or localStorage
        const customerId = authState?.customerId || localStorage.getItem('customer_id');
        if (customerId) {
            setNewItem(prev => ({
                ...prev,
                customer: parseInt(customerId)
            }));
        } else {
            setActionMessage({ 
                type: 'error', 
                text: 'Customer ID not found. Please log in again.' 
            });
        }
    }, [setResource, authState]);

    const handleCreateItem = async (e) => { 
        e.preventDefault();
        
        if (!newItem.address.trim()) {
            setActionMessage({ type: 'error', text: 'Please enter an address' });
            return;
        }
        
        if (!newItem.customer) {
            setActionMessage({ 
                type: 'error', 
                text: 'Customer ID not found. Please log in again.' 
            });
            return;
        }
        
        try {
            setActionInProgress(true);
            setActionMessage({ type: 'info', text: 'Adding address...' });
            
            console.log('Creating address with data:', newItem);
            await createItem(newItem);
            
            setActionMessage({ type: 'success', text: 'Address added successfully' });
            
            // Navigate back to addresses page after successful creation
            setTimeout(() => {
                navigate('/customer/addresses');
            }, 1500);
        } catch (err) {
            console.error("Error creating address:", err);
            setActionMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to add address. Please try again.' 
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
                        <h2><FontAwesomeIcon icon={faMapMarkerAlt} /> Add New Address</h2>
                        <p>Add a new shipping address to your account</p>
                    </div>
                    
                    {renderActionMessage()}
                    
                    {loading && !actionInProgress ? (
                        <div className="loading-message">
                            <FontAwesomeIcon icon={faSpinner} spin />
                            <span>Loading...</span>
                        </div>
                    ) : error && !actionMessage ? (
                        <div className="error-message">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>{error}</span>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateItem} className="form-content">
                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <textarea 
                                    id="address" 
                                    name="address" 
                                    value={newItem.address}
                                    onChange={(e) => setNewItem({ ...newItem, address: e.target.value })}
                                    placeholder="Enter your full address"
                                    required
                                />
                            </div>
                            
                            <div className="checkbox-container">
                                <input 
                                    type="checkbox" 
                                    id="default_address"
                                    checked={newItem.default_address} 
                                    onChange={(e) => setNewItem({ ...newItem, default_address: e.target.checked})}
                                />
                                <label htmlFor="default_address">Set as Default Address</label>
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="submit-btn"
                                    disabled={actionInProgress || !newItem.customer}
                                >
                                    {actionInProgress ? 'Adding...' : 'Save Address'}
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

export default AddAddress;