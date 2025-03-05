/**
 * ApiDataContext.js
 * Provides centralized API data fetching and caching throughout the application
 */
import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, useRef } from "react";
import { API_BASE_URL, CACHE_EXPIRATION } from "./config";
import { productsAPI, categoriesAPI, authAPI } from "../services/api";
import axios from "axios";
import { useAuth } from './AuthContext';

// Create context
const ApiDataContext = createContext();

// Action types
const API_ACTIONS = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_FEATURED_PRODUCTS: 'SET_FEATURED_PRODUCTS',
  SET_CATEGORY_PRODUCTS: 'SET_CATEGORY_PRODUCTS',
  SET_PRODUCT_DETAILS: 'SET_PRODUCT_DETAILS',
  SET_RELATED_PRODUCTS: 'SET_RELATED_PRODUCTS',
  SET_RECOMMENDED_PRODUCTS: 'SET_RECOMMENDED_PRODUCTS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_RESOURCE_DATA: 'SET_RESOURCE_DATA',
};

// Initial state
const initialState = {
  categories: [],
  products: [],
  featuredProducts: [],
  categoryProducts: {},
  productDetails: {},
  relatedProducts: {},
  recommendedProducts: [],
  resourceData: {},
  loading: false,
  error: null,
  lastFetched: {
    categories: null,
    products: null,
    featuredProducts: null,
    recommendedProducts: null,
  },
};

// Global registry to track failed endpoints
const failedEndpointsRegistry = {
  endpoints: {},
  registerFailedEndpoint: (endpoint, status) => {
    console.warn(`Registering failed endpoint: ${endpoint} with status ${status}`);
    failedEndpointsRegistry.endpoints[endpoint] = {
      status,
      timestamp: Date.now()
    };
  },
  hasFailedPermanently: (endpoint) => {
    const entry = failedEndpointsRegistry.endpoints[endpoint];
    // Consider 404 errors as permanent failures
    return entry && entry.status === 404;
  }
};

// Reducer function
const apiDataReducer = (state, action) => {
  switch (action.type) {
    case API_ACTIONS.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case API_ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
      };
    case API_ACTIONS.FETCH_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case API_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case API_ACTIONS.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
        lastFetched: {
          ...state.lastFetched,
          categories: Date.now(),
        },
        loading: false,
      };
    case API_ACTIONS.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload,
        lastFetched: {
          ...state.lastFetched,
          products: Date.now(),
        },
        loading: false,
      };
    case API_ACTIONS.SET_FEATURED_PRODUCTS:
      return {
        ...state,
        featuredProducts: action.payload,
        lastFetched: {
          ...state.lastFetched,
          featuredProducts: Date.now(),
        },
        loading: false,
      };
    case API_ACTIONS.SET_CATEGORY_PRODUCTS:
      return {
        ...state,
        categoryProducts: {
          ...state.categoryProducts,
          [action.payload.categoryId]: {
            data: action.payload.products,
            lastFetched: Date.now(),
          },
        },
        loading: false,
      };
    case API_ACTIONS.SET_PRODUCT_DETAILS:
      return {
        ...state,
        productDetails: {
          ...state.productDetails,
          [action.payload.id]: {
            data: action.payload,
            lastFetched: Date.now(),
          },
        },
        loading: false,
      };
    case API_ACTIONS.SET_RELATED_PRODUCTS:
      return {
        ...state,
        relatedProducts: {
          ...state.relatedProducts,
          [action.payload.productId]: {
            data: action.payload.products,
            lastFetched: Date.now(),
          },
        },
        loading: false,
      };
    case API_ACTIONS.SET_RECOMMENDED_PRODUCTS:
      return {
        ...state,
        recommendedProducts: action.payload,
        lastFetched: {
          ...state.lastFetched,
          recommendedProducts: Date.now(),
        },
        loading: false,
      };
    case API_ACTIONS.SET_RESOURCE_DATA:
      return {
        ...state,
        resourceData: {
          ...state.resourceData,
          [action.payload.resource]: action.payload.data,
        },
        loading: false,
      };
    default:
      return state;
  }
};

// Custom hook to use the context
export const useApiData = () => useContext(ApiDataContext);

// Provider component
export const ApiDataProvider = ({ children }) => {
    const { authState } = useAuth();
    const [state, dispatch] = useReducer(apiDataReducer, initialState);
    const [resource, setResource] = useState('');
    const [data, setData] = useState([]);
    const [loading] = useState(false);
    const [error] = useState(null);
    
    // Keep track of in-flight requests to prevent duplicates
    const pendingRequests = useRef({});
    
    // Check if cache is expired
    const isCacheExpired = (timestamp) => {
        if (!timestamp) return true;
        return Date.now() - timestamp > CACHE_EXPIRATION;
    };

    // Clear error
    const clearError = useCallback(() => {
        dispatch({ type: API_ACTIONS.CLEAR_ERROR });
    }, []);
    
    // Handle API errors
    const handleApiError = useCallback((error, defaultMessage) => {
        console.error('API Error:', error);
        
        let errorMessage = defaultMessage;
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            errorMessage = error.response.data?.message || 
                          error.response.data?.msg || 
                          `Error ${error.response.status}: ${defaultMessage}`;
        } else if (error.request) {
            // The request was made but no response was received
            errorMessage = 'No response from server. Please check your connection.';
        } else {
            // Something happened in setting up the request that triggered an Error
            errorMessage = error.message || defaultMessage;
        }
        
        dispatch({ type: API_ACTIONS.FETCH_ERROR, payload: errorMessage });
        return [];
    }, []);
    
    // Generic fetch data function with duplicate prevention
    const fetchData = useCallback(async (endpoint, method = 'GET', data = null, isFormData = false) => {
        // Check if this endpoint has permanently failed (404)
        const endpointKey = endpoint.split('?')[0]; // Remove query params for checking
        if (failedEndpointsRegistry.hasFailedPermanently(endpointKey)) {
            console.warn(`Skipping request to permanently failed endpoint: ${endpoint}`);
            return Promise.reject({
                response: { status: 404 },
                message: 'Endpoint previously returned 404 Not Found'
            });
        }
        
        // Create a unique key for this request
        const requestKey = `${method}:${endpoint}:${data ? JSON.stringify(data) : ''}`;
        
        // Check if a request with this key is already in progress
        if (pendingRequests.current[requestKey]) {
            console.log(`Duplicate request prevented: ${requestKey}`);
            return pendingRequests.current[requestKey];
        }
        
        // Proper URL construction
        let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        
        // Set up the request config
        const config = {
            headers: {
                'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
            },
        };
        
        // Add authorization token if available
        if (authState.token) {
            config.headers['Authorization'] = `Bearer ${authState.token}`;
        }
        
        dispatch({ type: API_ACTIONS.FETCH_START });
        
        // Create the promise for this request
        const requestPromise = (async () => {
            try {
                let response;
                
                // Execute the appropriate axios method
                switch (method.toUpperCase()) {
                    case 'GET':
                        response = await axios.get(url, config);
                        break;
                    case 'POST':
                        response = await axios.post(url, data, config);
                        break;
                    case 'PUT':
                        response = await axios.put(url, data, config);
                        break;
                    case 'PATCH':
                        response = await axios.patch(url, data, config);
                        break;
                    case 'DELETE':
                        response = await axios.delete(url, config);
                        break;
                    default:
                        throw new Error(`Unsupported HTTP method: ${method}`);
                }
                
                dispatch({ type: API_ACTIONS.FETCH_SUCCESS });
                
                // Clear this request from pending requests
                delete pendingRequests.current[requestKey];
                
                // Return the response data
                return response;
            } catch (error) {
                // Register permanently failed endpoints (404)
                if (error.response && error.response.status === 404) {
                    failedEndpointsRegistry.registerFailedEndpoint(endpointKey, 404);
                    
                    // Also register in global window registry for cross-component awareness
                    if (typeof window !== 'undefined') {
                        if (!window.__FAILED_ENDPOINTS) window.__FAILED_ENDPOINTS = {};
                        window.__FAILED_ENDPOINTS[endpointKey] = {
                            status: 404,
                            timestamp: Date.now()
                        };
                    }
                }
                
                // Handle API errors
                handleApiError(error, `Error making ${method} request to ${endpoint}`);
                
                // Clear this request from pending requests even on error
                delete pendingRequests.current[requestKey];
                
                // For 401 errors, add a small delay to prevent rapid retries
                if (error.response && error.response.status === 401) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Re-throw the error so callers can handle it
                throw error;
            }
        })();
        
        // Store the promise in pendingRequests
        pendingRequests.current[requestKey] = requestPromise;
        
        return requestPromise;
    }, [authState.token, handleApiError]);
    
    // Get customer ID from auth state or localStorage
    const getCustomerId = useCallback(async () => {
        // First try to get from auth state
        if (authState.customerId) {
            return authState.customerId;
        }
        
        // Then try to get from localStorage
        const storedCustomerId = localStorage.getItem('customer_id');
        if (storedCustomerId) {
            return storedCustomerId;
        }
        
        // If not found, try to get user info from API
        if (authState.token) {
            try {
                console.log('Fetching user info to get customer ID');
                const response = await authAPI.getUser();
                
                if (response.data && response.data.customer_id) {
                    // Store customer ID in localStorage for future use
                    localStorage.setItem('customer_id', response.data.customer_id);
                    return response.data.customer_id;
                }
                
                throw new Error('Customer ID not found in user profile');
            } catch (error) {
                console.error('Error retrieving user info:', error);
                throw new Error('Unable to retrieve user information. Please log in again.');
            }
        }
        
        throw new Error('Authentication required. Please log in.');
    }, [authState.customerId, authState.token]);

    // Get vendor ID from auth state or localStorage
    const getVendorId = useCallback(async () => {
        // First try to get from auth state
        if (authState.vendorId) {
            return authState.vendorId;
        }
        
        // Then try to get from localStorage
        const storedVendorId = localStorage.getItem('vendor_id');
        if (storedVendorId) {
            return storedVendorId;
        }
        
        // If not found, try to get user info from API
        if (authState.token) {
            try {
                console.log('Fetching user info to get vendor ID');
                const response = await authAPI.getUser();
                
                if (response.data && response.data.vendor_id) {
                    // Store vendor ID in localStorage for future use
                    localStorage.setItem('vendor_id', response.data.vendor_id);
                    return response.data.vendor_id;
                }
                
                throw new Error('Vendor ID not found in user profile');
            } catch (error) {
                console.error('Error retrieving user info:', error);
                throw new Error('Unable to retrieve user information. Please log in again.');
            }
        }
        
        throw new Error('Authentication required. Please log in.');
    }, [authState.vendorId, authState.token]);
    
    // Define helper functions before they're used in fetchResourceData
    // Address management functions
    const fetchAddresses = useCallback(async () => {
        try {
            const customerId = await getCustomerId();
            return await fetchData(`/customer/${customerId}/addresses/`);
        } catch (error) {
            console.error('Error fetching addresses:', error);
            throw error;
        }
    }, [getCustomerId, fetchData]);

    // Wishlist management functions
    const fetchWishlist = useCallback(async () => {
        try {
            const customerId = await getCustomerId();
            return await fetchData(`/customer/${customerId}/wishlist/`);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            throw error;
        }
    }, [getCustomerId, fetchData]);

    // Product management for vendors
    const fetchVendorProducts = useCallback(async () => {
        try {
            const vendorId = await getVendorId();
            return await fetchData(`/vendor/${vendorId}/products/`);
        } catch (error) {
            console.error('Error fetching vendor products:', error);
            throw error;
        }
    }, [getVendorId, fetchData]);
    
    // Now that we've defined our helper functions, we can use them in fetchResourceData
    // Generic fetch resource data
    const fetchResourceData = useCallback(async (resourceName) => {
        dispatch({ type: API_ACTIONS.FETCH_START });
        
        try {
            let response;
            
            switch (resourceName) {
                case 'address':
                    response = await fetchAddresses();
                    break;
                case 'wishlist':
                    response = await fetchWishlist();
                    break;
                case 'products':
                    response = await fetchVendorProducts();
                    break;
                default:
                    response = await axios.get(`${API_BASE_URL}/${resourceName}/`);
            }
            
            setData(response.data);
            dispatch({ 
                type: API_ACTIONS.SET_RESOURCE_DATA, 
                payload: { resource: resourceName, data: response.data } 
            });
            dispatch({ type: API_ACTIONS.FETCH_SUCCESS });
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to fetch ${resourceName}`);
            return [];
        }
    }, [handleApiError, fetchAddresses, fetchWishlist, fetchVendorProducts]);

    // Rest of the functions with the proper ordering to avoid circular dependencies...
    
    const createAddress = async (addressData) => {
        try {
            const customerId = await getCustomerId();
            const itemData = { ...addressData, customer: customerId };
            return await fetchData(`/customer/${customerId}/addresses/`, 'POST', itemData);
        } catch (error) {
            console.error('Error creating address:', error);
            throw error;
        }
    };

    const updateAddress = async (addressId, addressData) => {
        try {
            const customerId = await getCustomerId();
            const updateData = {
                address: addressData.address,
                default_address: addressData.default_address
            };
            return await fetchData(`/customer/${customerId}/addresses/${addressId}/`, 'PATCH', updateData);
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    };

    const deleteAddress = async (addressId) => {
        try {
            const customerId = await getCustomerId();
            return await fetchData(`/customer/${customerId}/addresses/${addressId}/`, 'DELETE');
        } catch (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
    };

    const addToWishlist = async (productId) => {
        try {
            const customerId = await getCustomerId();
            return await fetchData(`/customer/${customerId}/wishlist/`, 'POST', { product: productId });
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            throw error;
        }
    };

    const removeFromWishlist = async (wishlistItemId) => {
        try {
            const customerId = await getCustomerId();
            return await fetchData(`/customer/${customerId}/wishlist/${wishlistItemId}/`, 'DELETE');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            throw error;
        }
    };

    // Fetch orders for the current customer
    const fetchOrders = async () => {
        try {
            const customerId = await getCustomerId();
            return await fetchData(`/customer/${customerId}/orders/`);
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    };

    const createProduct = async (productData) => {
        try {
            const vendorId = await getVendorId();
            const itemData = { ...productData, vendor: vendorId };
            return await fetchData(`/vendor/${vendorId}/products/`, 'POST', itemData, true);
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    };

    const updateProduct = async (productId, productData) => {
        try {
            const vendorId = await getVendorId();
            return await fetchData(`/vendor/${vendorId}/products/${productId}/`, 'PATCH', productData, true);
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    };

    const deleteProduct = async (productId) => {
        try {
            const vendorId = await getVendorId();
            return await fetchData(`/vendor/${vendorId}/products/${productId}/`, 'DELETE');
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    };

    // Fetch all categories
    const fetchCategories = useCallback(async (forceRefresh = false) => {
        // Return cached data if available and not expired
        if (!forceRefresh && state.categories.length > 0 && !isCacheExpired(state.lastFetched.categories)) {
            return state.categories;
        }
        
        dispatch({ type: API_ACTIONS.FETCH_START });
        try {
            const response = await categoriesAPI.getAll();
            dispatch({ type: API_ACTIONS.SET_CATEGORIES, payload: response.data });
            return response.data;
        } catch (error) {
            return handleApiError(error, 'Failed to fetch categories');
        }
    }, [state.categories, state.lastFetched.categories, handleApiError]);
    
    // Fetch all products
    const fetchProducts = useCallback(async (params = {}, forceRefresh = false) => {
        // Return cached data if available and not expired
        if (!forceRefresh && state.products.length > 0 && !isCacheExpired(state.lastFetched.products)) {
            return state.products;
        }
        
        dispatch({ type: API_ACTIONS.FETCH_START });
        try {
            const response = await productsAPI.getAll(params);
            dispatch({ type: API_ACTIONS.SET_PRODUCTS, payload: response.data });
            return response.data;
        } catch (error) {
            return handleApiError(error, 'Failed to fetch products');
        }
    }, [state.products, state.lastFetched.products, handleApiError]);
    
    // Fetch featured products
    const fetchFeaturedProducts = useCallback(async (forceRefresh = false) => {
        // Generate a unique request key
        const requestKey = 'featured-products';
        
        // Check if the featured endpoint has permanently failed (404)
        if (failedEndpointsRegistry.hasFailedPermanently('/products/featured/')) {
            console.log('Featured products endpoint previously failed with 404, using fallback immediately');
            return fetchProducts({ limit: 5, sort: 'popularity' });
        }
        
        // Check if this request is already in progress
        if (pendingRequests.current[requestKey]) {
            console.log(`Request for ${requestKey} already in progress, skipping duplicate`);
            return state.featuredProducts;
        }
        
        // Return cached data if available and not expired
        if (!forceRefresh && state.featuredProducts.length > 0 && !isCacheExpired(state.lastFetched.featuredProducts)) {
            return state.featuredProducts;
        }
        
        // Mark this request as in progress
        pendingRequests.current[requestKey] = true;
        
        dispatch({ type: API_ACTIONS.FETCH_START });
        try {
            let response;
            
            try {
                // First try to get featured products from the dedicated endpoint
                response = await productsAPI.getFeatured();
            } catch (featuredError) {
                // If it's a 404 error, the endpoint doesn't exist
                if (featuredError.response && featuredError.response.status === 404) {
                    // Register the failed endpoint globally
                    failedEndpointsRegistry.registerFailedEndpoint('/products/featured/', 404);
                    
                    // Also register in window global for cross-component awareness
                    if (typeof window !== 'undefined') {
                        if (!window.__FAILED_ENDPOINTS) window.__FAILED_ENDPOINTS = {};
                        window.__FAILED_ENDPOINTS['/products/featured/'] = {
                            status: 404,
                            timestamp: Date.now()
                        };
                    }
                    
                    console.warn('Featured products endpoint not available, falling back to regular products');
                    // Use regular products as a fallback, sorted by popularity
                    response = await productsAPI.getAll({ limit: 5, sort: 'popularity' });
                } else {
                    // For other errors, rethrow to be handled by the outer catch
                    throw featuredError;
                }
            }
            
            dispatch({ type: API_ACTIONS.SET_FEATURED_PRODUCTS, payload: response.data });
            
            // Request completed, remove from pending
            delete pendingRequests.current[requestKey];
            
            return response.data;
        } catch (error) {
            // Request failed, remove from pending
            delete pendingRequests.current[requestKey];
            
            // If we haven't returned any featured products yet, use placeholder data
            if (state.featuredProducts.length === 0) {
                const placeholderData = [
                    {
                        id: 'placeholder-1',
                        title: 'Featured Product 1',
                        price: '9.99',
                        thumbnail: 'https://via.placeholder.com/800x400?text=Featured+Product+1'
                    },
                    {
                        id: 'placeholder-2',
                        title: 'Featured Product 2',
                        price: '19.99',
                        thumbnail: 'https://via.placeholder.com/800x400?text=Featured+Product+2'
                    },
                    {
                        id: 'placeholder-3',
                        title: 'Featured Product 3',
                        price: '29.99',
                        thumbnail: 'https://via.placeholder.com/800x400?text=Featured+Product+3'
                    }
                ];
                
                dispatch({ type: API_ACTIONS.SET_FEATURED_PRODUCTS, payload: placeholderData });
                return placeholderData;
            }
            
            return handleApiError(error, 'Failed to fetch featured products');
        }
    }, [state.featuredProducts, state.lastFetched.featuredProducts, handleApiError, fetchProducts]);
    
    // Fetch products by category
    const fetchProductsByCategory = useCallback(async (categoryId, params = {}, forceRefresh = false) => {
        // Return cached data if available and not expired
        const cachedData = state.categoryProducts[categoryId];
        if (!forceRefresh && cachedData && !isCacheExpired(cachedData.lastFetched)) {
            return cachedData.data;
        }
        
        dispatch({ type: API_ACTIONS.FETCH_START });
        try {
            const response = await productsAPI.getByCategory(categoryId, params);
            dispatch({ 
                type: API_ACTIONS.SET_CATEGORY_PRODUCTS, 
                payload: { categoryId, products: response.data } 
            });
            return response.data;
        } catch (error) {
            return handleApiError(error, `Failed to fetch products for category ${categoryId}`);
        }
    }, [state.categoryProducts, handleApiError]);
    
    // Fetch product details
    const fetchProductDetails = async (productId) => {
        if (!productId) return null;
        
        try {
            const product = await fetchData(`/product/${productId}/`, 'GET');
            
            // Track the view of this product
            await trackProductView(productId);
            
            return product;
        } catch (error) {
            console.error('Error fetching product details:', error);
            throw error;
        }
    };

    // Track product view
    const trackProductView = async (productId) => {
        if (!productId) return;
        
        try {
            const customerId = await getCustomerId();
            
            if (customerId) {
                // For logged in users, track on the server
                await fetchData(`/customer-interactions/`, 'POST', {
                    customer: customerId,
                    product: productId,
                    viewed: true,
                    view_count: 1
                });
            }
            
            // Always increment product statistics (anonymous)
            await fetchData(`/product-statistics/${productId}/`, 'PATCH', {
                view_count_increment: 1
            });
        } catch (error) {
            console.error('Error tracking product view:', error);
            // Don't throw error for tracking failures
        }
    };
    
    // Track cart add
    const trackCartAdd = async (productId) => {
        if (!productId) return;
        
        try {
            const customerId = await getCustomerId();
            
            if (customerId) {
                // For logged in users, track on the server
                await fetchData(`/customer-interactions/`, 'POST', {
                    customer: customerId,
                    product: productId,
                    added_to_cart: true
                });
            }
            
            // Always increment product statistics (anonymous)
            await fetchData(`/product-statistics/${productId}/`, 'PATCH', {
                cart_add_count_increment: 1
            });
        } catch (error) {
            console.error('Error tracking cart add:', error);
            // Don't throw error for tracking failures
        }
    };
    
    // Track wishlist add
    const trackWishlistAdd = async (productId) => {
        if (!productId) return;
        
        try {
            const customerId = await getCustomerId();
            
            if (customerId) {
                // For logged in users, track on the server
                await fetchData(`/customer-interactions/`, 'POST', {
                    customer: customerId,
                    product: productId,
                    added_to_wishlist: true
                });
            }
            
            // Always increment product statistics (anonymous)
            await fetchData(`/product-statistics/${productId}/`, 'PATCH', {
                wishlist_add_count_increment: 1
            });
        } catch (error) {
            console.error('Error tracking wishlist add:', error);
            // Don't throw error for tracking failures
        }
    };
    
    // Fetch related products
    const fetchRelatedProducts = async (productId, limit = 5) => {
        if (!productId) return [];
        
        try {
            const response = await fetchData(`/related-products/?product_id=${productId}`, 'GET');
            if (response && Array.isArray(response.data)) {
                // Extract only the target product details and limit
                return response.data
                    .map(item => item.target_product_details)
                    .filter(Boolean)
                    .slice(0, limit);
            }
            return [];
        } catch (error) {
            console.error('Error fetching related products:', error);
            throw error;
        }
    };
    
    // Track user behavior for analytics
    const trackUserBehavior = (action, data = {}) => {
        if (!authState.token) {
            console.log('User not authenticated, skipping behavior tracking');
            return;
        }
        
        try {
            // Log the action for analytics (simplified implementation)
            console.log(`Tracking user behavior: ${action}`, data);
            
            // In a real implementation, you would send this to your analytics endpoint
            // Example: fetchData('/analytics/track', 'POST', { action, data });
        } catch (error) {
            console.error('Error tracking user behavior:', error);
        }
    };

    // Fetch popular products for non-authenticated users
    const fetchPopularProducts = async (limit = 5) => {
        try {
            // Get popular products based on view count or sales
            const response = await fetchData(`/products/popular/?limit=${limit}`);
            
            // Track that we've shown popular products (for anonymous analytics)
            console.log('Showing popular products to user');
            
            return response;
        } catch (error) {
            console.error('Error fetching popular products:', error);
            
            // Return empty array as fallback
            return { data: [] };
        }
    };
    
    // Fetch recommended products with better error handling
    const fetchRecommendedProducts = async (limit = 5) => {
        // First check if the user is authenticated
        if (!authState.token) {
            console.log('User not authenticated, fetching popular products instead of recommendations');
            return fetchPopularProducts(limit);
        }
        
        try {
            // Try to get recommendations
            const response = await fetchData(`/recommendations/?limit=${limit}`);
            
            // Track that we've viewed recommendations for analytics
            trackUserBehavior('view_recommendations');
            
            return response;
        } catch (error) {
            console.error('Error fetching recommended products:', error);
            
            // For 401 errors, fallback to popular products but don't retry immediately
            if (error.response && error.response.status === 401) {
                console.log('Unauthorized to access recommendations, falling back to popular products');
                return fetchPopularProducts(limit);
            }
            
            // For other errors, also fallback to popular products
            console.log('Error fetching recommendations, falling back to popular products');
            return fetchPopularProducts(limit);
        }
    };
    
    // Fetch categories with stats
    const fetchCategoriesWithStats = async () => {
        try {
            return await fetchData('/categories-with-stats/', 'GET');
        } catch (error) {
            console.error('Error fetching categories with stats:', error);
            throw error;
        }
    };
    
    // Watch for resource changes
    useEffect(() => {
        if (resource) {
            fetchResourceData(resource);
        }
    }, [resource, fetchResourceData]);
    
    // Prefetch initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await fetchCategories();
                await fetchFeaturedProducts();
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };
        
        loadInitialData();
    }, [fetchCategories, fetchFeaturedProducts]);
    
    // Context value
    const value = {
        ...state,
        data,
        resource,
        setResource,
        fetchCategories,
        fetchProducts,
        fetchFeaturedProducts,
        fetchProductsByCategory,
        fetchProductDetails,
        fetchResourceData,
        createAddress,
        updateAddress,
        deleteAddress,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        fetchOrders,
        fetchVendorProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        clearError,
        getCustomerId,
        getVendorId,
        loading,
        error,
        fetchData,
        fetchRelatedProducts,
        fetchRecommendedProducts,
        fetchCategoriesWithStats,
        trackProductView,
        trackCartAdd,
        trackWishlistAdd
    };
    
    return (
        <ApiDataContext.Provider value={value}>
            {children}
        </ApiDataContext.Provider>
    );
};