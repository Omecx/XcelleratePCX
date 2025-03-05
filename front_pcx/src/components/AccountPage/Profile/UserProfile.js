/**
 * UserProfile.js
 * User profile management component
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Contexts/AuthContext';
import { useApiData } from '../../../Contexts/ApiDataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSpinner, 
    faExclamationTriangle, 
    faUser, 
    faCamera, 
    faEnvelope, 
    faIdCard,
    faPhone,
    faMapMarkerAlt,
    faCheckCircle,
    faEdit,
    faSave,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import './UserProfile.css';

/**
 * UserProfile Component
 * Displays and allows editing of user profile information
 */
const UserProfile = () => {
    const { authState } = useAuth();
    const { fetchData } = useApiData();
    
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        mobile: '',
        address: '',
        profilePicture: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    
    // Fetch user profile data function (extracted for reuse)
    const fetchUserProfile = async () => {
        if (!authState.isAuthenticated) return;
        
        try {
            setLoading(true);
            setError(null);
            
            // Use the appropriate endpoint based on user type
            let endpoint;
            let customerId = null;
            let vendorId = null;
            
            if (authState.userType === 'customer') {
                customerId = authState.customerId || localStorage.getItem('customer_id');
                if (!customerId) {
                    throw new Error('Customer ID not found. Please log in again.');
                }
                endpoint = `/customer/${customerId}/`;
            } else if (authState.userType === 'vendor') {
                vendorId = authState.vendorId || localStorage.getItem('vendor_id');
                if (!vendorId) {
                    throw new Error('Vendor ID not found. Please log in again.');
                }
                endpoint = `/vendor/${vendorId}/`;
            } else {
                throw new Error('Unknown user type');
            }
            
            const response = await fetchData(endpoint);
            
            if (!response || !response.data) {
                throw new Error('Invalid response from server');
            }
            
            // Extract user data from the response
            const userData = response.data;
            
            if (!userData.user) {
                throw new Error('User data not found in response');
            }
            
            setProfileData({
                username: userData.user.username || '',
                email: userData.user.email || '',
                firstName: userData.user.first_name || '',
                lastName: userData.user.last_name || '',
                mobile: authState.userType === 'customer' ? (userData.mobile || '') : '',
                address: authState.userType === 'vendor' ? (userData.address || '') : '',
                profilePicture: userData.user.profile_picture || null
            });
            
            setLoading(false);
        } catch (err) {
            setError('Failed to load profile data: ' + (err.message || 'Unknown error'));
            setLoading(false);
            console.error('Error fetching profile data:', err);
        }
    };
    
    // Fetch user profile data on component mount
    useEffect(() => {
        fetchUserProfile();
    }, [authState.isAuthenticated, authState.userType, authState.customerId, authState.vendorId]);
    
    // Handle profile picture change
    const handleProfilePictureChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            setUploadingImage(true);
            setActionInProgress(true);
            
            // Create form data for file upload
            const formData = new FormData();
            formData.append('profile_picture', file);
            
            // Use the appropriate endpoint based on user type
            let endpoint;
            if (authState.userType === 'customer') {
                endpoint = `/customer/${authState.customerId}/`;
            } else if (authState.userType === 'vendor') {
                endpoint = `/vendor/${authState.vendorId}/`;
            } else {
                throw new Error('Unknown user type');
            }
            
            const response = await fetchData(endpoint, 'PATCH', formData, true);
            
            if (!response || !response.data || !response.data.user) {
                throw new Error('Invalid response from server');
            }
            
            // Update profile data with new profile picture URL
            setProfileData(prev => ({
                ...prev,
                profilePicture: response.data.user.profile_picture
            }));
            
            setUploadingImage(false);
            showSuccessMessage('Profile picture updated successfully');
            
        } catch (err) {
            setError('Failed to update profile picture: ' + (err.message || 'Unknown error'));
            console.error('Error updating profile picture:', err);
        } finally {
            setUploadingImage(false);
            setActionInProgress(false);
        }
    };
    
    // Handle profile data update
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        try {
            setActionInProgress(true);
            setLoading(true);
            
            // Use the appropriate endpoint based on user type
            let endpoint;
            let userData = {
                user: {
                    username: profileData.username,
                    email: profileData.email,
                    first_name: profileData.firstName,
                    last_name: profileData.lastName
                }
            };
            
            if (authState.userType === 'customer') {
                endpoint = `/customer/${authState.customerId}/`;
                userData.mobile = profileData.mobile;
            } else if (authState.userType === 'vendor') {
                endpoint = `/vendor/${authState.vendorId}/`;
                userData.address = profileData.address;
            } else {
                throw new Error('Unknown user type');
            }
            
            const response = await fetchData(endpoint, 'PATCH', userData);
            
            if (!response || !response.data) {
                throw new Error('Invalid response from server');
            }
            
            // Update profile data with response
            const responseData = response.data;
            setProfileData({
                ...profileData,
                username: responseData.user.username || '',
                email: responseData.user.email || '',
                firstName: responseData.user.first_name || '',
                lastName: responseData.user.last_name || '',
                mobile: authState.userType === 'customer' ? (responseData.mobile || '') : profileData.mobile,
                address: authState.userType === 'vendor' ? (responseData.address || '') : profileData.address,
            });
            
            setIsEditing(false);
            showSuccessMessage('Profile updated successfully');
            
        } catch (err) {
            setError('Failed to update profile: ' + (err.message || 'Unknown error'));
            console.error('Error updating profile:', err);
        } finally {
            setLoading(false);
            setActionInProgress(false);
        }
    };
    
    // Cancel editing
    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset form data to original values
        setLoading(true);
        setError(null);
        fetchUserProfile();
    };
    
    // Show success message temporarily
    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };
    
    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Render loading state
    if (loading && !isEditing && !actionInProgress) {
        return (
            <div className="profile-container loading-container">
                <div className="loading-spinner">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Loading your profile...</span>
                </div>
            </div>
        );
    }
    
    // Render error state
    if (error && !isEditing) {
        return (
            <div className="profile-container error-container">
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
    
    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                {!isEditing && (
                    <button 
                        className="edit-profile-btn" 
                        onClick={() => setIsEditing(true)}
                        disabled={actionInProgress}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                        Edit Profile
                    </button>
                )}
            </div>
            
            {successMessage && (
                <div className="success-message">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>{successMessage}</span>
                </div>
            )}
            
            <div className="profile-content">
                <div className="profile-picture-section">
                    <div className="profile-picture-container">
                        {profileData.profilePicture ? (
                            <img 
                                src={profileData.profilePicture} 
                                alt="Profile" 
                                className="profile-picture" 
                            />
                        ) : (
                            <div className="profile-picture-placeholder">
                                <FontAwesomeIcon icon={faUser} />
                            </div>
                        )}
                        
                        {isEditing && (
                            <div className="profile-picture-overlay">
                                <label htmlFor="profile-picture-upload" className="upload-label">
                                    <FontAwesomeIcon icon={faCamera} />
                                    <span>Change</span>
                                </label>
                                <input 
                                    type="file" 
                                    id="profile-picture-upload" 
                                    accept="image/*" 
                                    onChange={handleProfilePictureChange}
                                    disabled={uploadingImage}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        )}
                        
                        {uploadingImage && (
                            <div className="upload-overlay">
                                <FontAwesomeIcon icon={faSpinner} spin />
                                <span>Uploading...</span>
                            </div>
                        )}
                    </div>
                    <h2 className="profile-name">
                        {profileData.firstName || profileData.lastName 
                            ? `${profileData.firstName} ${profileData.lastName}` 
                            : profileData.username}
                    </h2>
                    <p className="profile-type">{authState.userType === 'customer' ? 'Customer' : 'Vendor'}</p>
                </div>
                
                <div className="profile-details-section">
                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label htmlFor="username">
                                <FontAwesomeIcon icon={faUser} />
                                Username
                            </label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                value={profileData.username} 
                                onChange={handleInputChange}
                                disabled={!isEditing || actionInProgress}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="email">
                                <FontAwesomeIcon icon={faEnvelope} />
                                Email
                            </label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                value={profileData.email} 
                                onChange={handleInputChange}
                                disabled={!isEditing || actionInProgress}
                                required
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">
                                    <FontAwesomeIcon icon={faIdCard} />
                                    First Name
                                </label>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    name="firstName" 
                                    value={profileData.firstName} 
                                    onChange={handleInputChange}
                                    disabled={!isEditing || actionInProgress}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="lastName">
                                    <FontAwesomeIcon icon={faIdCard} />
                                    Last Name
                                </label>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    name="lastName" 
                                    value={profileData.lastName} 
                                    onChange={handleInputChange}
                                    disabled={!isEditing || actionInProgress}
                                />
                            </div>
                        </div>
                        
                        {authState.userType === 'customer' && (
                            <div className="form-group">
                                <label htmlFor="mobile">
                                    <FontAwesomeIcon icon={faPhone} />
                                    Mobile Number
                                </label>
                                <input 
                                    type="tel" 
                                    id="mobile" 
                                    name="mobile" 
                                    value={profileData.mobile} 
                                    onChange={handleInputChange}
                                    disabled={!isEditing || actionInProgress}
                                />
                            </div>
                        )}
                        
                        {authState.userType === 'vendor' && (
                            <div className="form-group">
                                <label htmlFor="address">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                                    Business Address
                                </label>
                                <textarea 
                                    id="address" 
                                    name="address" 
                                    value={profileData.address} 
                                    onChange={handleInputChange}
                                    disabled={!isEditing || actionInProgress}
                                    rows={3}
                                />
                            </div>
                        )}
                        
                        {isEditing && (
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="save-btn"
                                    disabled={actionInProgress}
                                >
                                    {actionInProgress ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSave} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={handleCancelEdit}
                                    disabled={actionInProgress}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 