/**
 * Profile.js
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
    faCheckCircle,
    faEdit,
    faSave,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import './Profile.css';

/**
 * UserProfile Component
 * Displays and allows editing of user profile information
 */
const UserProfile = () => {
    const { user, userType, isAuthenticated, authState } = useAuth();
    const { fetchData } = useApiData();
    
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        profilePicture: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    
    // Fetch user profile data
    useEffect(() => {
        const getUserProfile = async () => {
            if (!isAuthenticated || !authState.userId) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Use the appropriate endpoint based on user type
                let endpoint;
                if (userType === 'customer') {
                    endpoint = `/customer/${authState.userId}/`;
                } else if (userType === 'vendor') {
                    endpoint = `/vendor/${authState.userId}/`;
                } else {
                    throw new Error('Unknown user type');
                }
                
                const response = await fetchData(endpoint, 'GET');
                
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
                    profilePicture: userData.user.profile_picture || null
                });
                
                setLoading(false);
            } catch (err) {
                setError('Failed to load profile data: ' + (err.message || 'Unknown error'));
                setLoading(false);
                console.error('Error fetching profile data:', err);
            }
        };
        
        getUserProfile();
    }, [isAuthenticated, authState.userId, userType, fetchData]);
    
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
            if (userType === 'customer') {
                endpoint = `/customer/${authState.userId}/`;
            } else if (userType === 'vendor') {
                endpoint = `/vendor/${authState.userId}/`;
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
            if (userType === 'customer') {
                endpoint = `/customer/${authState.userId}/`;
            } else if (userType === 'vendor') {
                endpoint = `/vendor/${authState.userId}/`;
            } else {
                throw new Error('Unknown user type');
            }
            
            const userData = {
                user: {
                    username: profileData.username,
                    email: profileData.email,
                    first_name: profileData.firstName,
                    last_name: profileData.lastName
                }
            };
            
            const response = await fetchData(endpoint, 'PATCH', userData);
            
            if (!response || !response.data || !response.data.user) {
                throw new Error('Invalid response from server');
            }
            
            // Update profile data with response
            setProfileData({
                ...profileData,
                username: response.data.user.username || '',
                email: response.data.user.email || '',
                firstName: response.data.user.first_name || '',
                lastName: response.data.user.last_name || ''
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
        if (user) {
            setProfileData({
                username: user.username || '',
                email: user.email || '',
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                profilePicture: user.profile_picture || null
            });
        }
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
                        <span>Edit Profile</span>
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
                        {uploadingImage ? (
                            <div className="uploading-overlay">
                                <FontAwesomeIcon icon={faSpinner} spin />
                            </div>
                        ) : null}
                        
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
                        
                        <label className="change-picture-btn" htmlFor="profile-picture-input">
                            <FontAwesomeIcon icon={faCamera} />
                            <span>Change Picture</span>
                        </label>
                        
                        <input 
                            type="file" 
                            id="profile-picture-input" 
                            accept="image/*" 
                            onChange={handleProfilePictureChange}
                            disabled={uploadingImage || actionInProgress}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
                
                <div className="profile-details-section">
                    {isEditing ? (
                        <form onSubmit={handleProfileUpdate} className="profile-form">
                            <div className="form-group">
                                <label htmlFor="username">
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>Username</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    value={profileData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="email">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                    <span>Email</span>
                                </label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName">
                                        <FontAwesomeIcon icon={faIdCard} />
                                        <span>First Name</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="firstName" 
                                        name="firstName" 
                                        value={profileData.firstName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="lastName">
                                        <FontAwesomeIcon icon={faIdCard} />
                                        <span>Last Name</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="lastName" 
                                        name="lastName" 
                                        value={profileData.lastName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="save-btn"
                                    disabled={actionInProgress}
                                >
                                    <FontAwesomeIcon icon={faSave} />
                                    <span>{actionInProgress ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                                
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={handleCancelEdit}
                                    disabled={actionInProgress}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-info">
                            <div className="info-group">
                                <div className="info-label">
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>Username</span>
                                </div>
                                <div className="info-value">{profileData.username}</div>
                            </div>
                            
                            <div className="info-group">
                                <div className="info-label">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                    <span>Email</span>
                                </div>
                                <div className="info-value">{profileData.email}</div>
                            </div>
                            
                            <div className="info-group">
                                <div className="info-label">
                                    <FontAwesomeIcon icon={faIdCard} />
                                    <span>Name</span>
                                </div>
                                <div className="info-value">
                                    {profileData.firstName || profileData.lastName 
                                        ? `${profileData.firstName} ${profileData.lastName}`.trim() 
                                        : 'Not provided'}
                                </div>
                            </div>
                            
                            <div className="info-group">
                                <div className="info-label">
                                    <FontAwesomeIcon icon={faIdCard} />
                                    <span>Account Type</span>
                                </div>
                                <div className="info-value">{userType}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

