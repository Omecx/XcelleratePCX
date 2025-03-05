import { useEffect, useRef, useState } from "react";
import { useApiData } from "../../../../Contexts/ApiDataContext";
import { useAuth } from "../../../../Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../Contexts/config";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faCheckCircle, faPlus, faImage, faImages } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../../SideBar/SideBar';
import { MenuData } from '../../Vendor/VendorMenuData';
import '../../../../components/common/FormStyles.css';
import './VendorProducts.css';

const AddProducts = () => {
    const { authState } = useAuth();
    const navigate = useNavigate();
    const [categoryData, setCategoryData] = useState([]);
    const { data, loading, error, setResource, fetchResourceData } = useApiData();
    const [newItem, setNewItem] = useState({ 
        vendor: authState.vendorId,
        title: '',
        detail: '', 
        price: '', 
        category: '', 
        thumbnail: null,
        product_images: [], 
    });

    const fileInputRef = useRef(null);
    const multipleFileInputRef = useRef(null);
    const [selectedThumbnailName, setSelectedThumbnailName] = useState(null);
    const [selectedImageNames, setSelectedImageNames] = useState([]);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [imagePreviews, setImagePreviews] = useState([]);
    const [formError, setFormError] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await fetchResourceData('categories');
            setCategoryData(response);
        } catch (err) {
            console.error('Error fetching categories: ', err);
            setFormError('Failed to load categories. Please try again.');
        } 
    }; 

    useEffect(() => {  
        fetchCategories();
        setResource('products');
    }, [setResource]);

    const handleCreateItem = async (e) => {
        e.preventDefault();
        setFormError(null);
        
        // Validate form
        if (!newItem.title || !newItem.price || !newItem.category || !newItem.thumbnail) {
            setFormError('Please fill all required fields and upload a thumbnail image');
            return;
        }

        try {
            setActionInProgress(true);
            setActionMessage({ type: 'info', text: 'Creating product...' });
            
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            
            formData.append('vendor', authState.vendorId);
            formData.append('title', newItem.title);
            formData.append('detail', newItem.detail);
            formData.append('price', newItem.price);
            formData.append('category', newItem.category);
            formData.append('thumbnail', newItem.thumbnail);

            // Create product
            const response = await axios.post(`${API_BASE_URL}/products/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 201) {
                // Upload product images if any
                if (newItem.product_images.length > 0) {
                    setActionMessage({ type: 'info', text: 'Uploading product images...' });
                    
                    for (let i = 0; i < newItem.product_images.length; i++) {
                        const imgFormData = new FormData();
                        imgFormData.append('product', response.data.id);
                        imgFormData.append('image', newItem.product_images[i]);
                        
                        try {
                            await axios.post(`${API_BASE_URL}/productimg/`, imgFormData, {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                    Authorization: `Bearer ${token}`,
                                },
                            });
                        } catch (error) {
                            console.error('Error uploading product image:', error);
                        }
                    }
                }
                
                setActionMessage({ type: 'success', text: 'Product created successfully' });
                
                // Navigate back to products page
                setTimeout(() => {
                    navigate('/vendor/products');
                }, 1500);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            setActionMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create product. Please try again.' });
            setActionInProgress(false);
        }
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedThumbnailName(file.name);
            setNewItem({ ...newItem, thumbnail: file });
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMultipleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedImageNames(files.map(file => file.name));
            setNewItem({ ...newItem, product_images: files });
            
            // Create previews
            const previews = [];
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    previews.push(reader.result);
                    if (previews.length === files.length) {
                        setImagePreviews([...previews]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleRemoveImage = (index) => {
        const newImages = [...newItem.product_images];
        newImages.splice(index, 1);
        
        const newImageNames = [...selectedImageNames];
        newImageNames.splice(index, 1);
        
        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        
        setNewItem({ ...newItem, product_images: newImages });
        setSelectedImageNames(newImageNames);
        setImagePreviews(newPreviews);
    };

    const handleCustomButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleCustomButtonClickMultiple = () => {
        multipleFileInputRef.current.click();
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
        <div className="vendor-container">
            <Sidebar MenuData={MenuData} />
            
            <div className="vendor-content">
                <div className="form-container">
                    <div className="form-header">
                        <h2><FontAwesomeIcon icon={faPlus} /> Add New Product</h2>
                        <p>Create a new product listing for your store</p>
                    </div>
                    
                    {renderActionMessage()}
                    
                    {formError && (
                        <div className="error-message">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>{formError}</span>
                        </div>
                    )}
                    
                    {error && !formError && !actionMessage && (
                        <div className="error-message">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {loading && !actionInProgress && (
                        <div className="loading-message">
                            <FontAwesomeIcon icon={faSpinner} spin />
                            <span>Loading...</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleCreateItem} className="form-content">
                        <div className="form-group">
                            <label htmlFor="title">Product Title*</label>
                            <input 
                                type="text" 
                                id="title" 
                                value={newItem.title}
                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                placeholder="Enter product title"
                                required
                                disabled={actionInProgress}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="detail">Product Description</label>
                            <textarea 
                                id="detail" 
                                value={newItem.detail}
                                onChange={(e) => setNewItem({ ...newItem, detail: e.target.value })}
                                placeholder="Enter product description"
                                disabled={actionInProgress}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="price">Price*</label>
                            <input 
                                type="number" 
                                id="price" 
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                placeholder="Enter product price"
                                required
                                disabled={actionInProgress}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="category">Category*</label>
                            <select 
                                id="category" 
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                required
                                disabled={actionInProgress}
                            >
                                <option value="">Select a category</option>
                                {categoryData.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group file-upload-container">
                            <label><FontAwesomeIcon icon={faImage} /> Thumbnail Image*</label>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleThumbnailChange}
                                accept="image/*"
                                disabled={actionInProgress}
                            />
                            <button 
                                type="button" 
                                onClick={handleCustomButtonClick}
                                className="file-upload-btn"
                                disabled={actionInProgress}
                            >
                                Choose Thumbnail
                            </button>
                            {selectedThumbnailName && <span className="file-name">{selectedThumbnailName}</span>}
                            
                            {thumbnailPreview && (
                                <div className="image-preview">
                                    <img src={thumbnailPreview} alt="Thumbnail preview" />
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group file-upload-container">
                            <label><FontAwesomeIcon icon={faImages} /> Additional Images</label>
                            <input 
                                type="file" 
                                multiple
                                ref={multipleFileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleMultipleImageChange}
                                accept="image/*"
                                disabled={actionInProgress}
                            />
                            <button 
                                type="button" 
                                onClick={handleCustomButtonClickMultiple}
                                className="file-upload-btn"
                                disabled={actionInProgress}
                            >
                                Add Images
                            </button>
                            
                            {selectedImageNames.length > 0 && (
                                <div className="selected-files">
                                    {selectedImageNames.map((name, index) => (
                                        <div key={index} className="file-item">
                                            <span>{name}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveImage(index)}
                                                className="remove-btn"
                                                disabled={actionInProgress}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {imagePreviews.length > 0 && (
                                <div className="image-previews">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="preview-item">
                                            <img src={preview} alt={`Preview ${index}`} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? 'Creating...' : 'Save Product'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => navigate('/vendor/products')}
                                className="cancel-btn"
                                disabled={actionInProgress}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddProducts;
