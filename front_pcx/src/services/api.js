/**
 * API Service
 * Centralized service for all API calls
 */

import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS, API_TIMEOUT } from '../Contexts/config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT, // Add timeout to prevent hanging requests
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the request timed out
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out:', originalRequest.url);
      return Promise.reject({
        response: {
          status: 408,
          data: { message: 'Request timed out. Please try again or check your internet connection.' }
        }
      });
    }
    
    // If there's a network error (no response from server)
    if (error.message === 'Network Error') {
      console.error('Network error:', originalRequest?.url);
      return Promise.reject({
        response: {
          status: 0,
          data: { message: 'Network error. Please check your internet connection and try again.' }
        }
      });
    }
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });
        
        // Store the new token
        const { access } = response.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
        
        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 404 errors with more specific messages
    if (error.response?.status === 404) {
      const url = originalRequest?.url || '';
      let message = 'Resource not found.';
      
      if (url.includes('address')) {
        message = 'Address not found. The address may have been deleted or the URL is incorrect.';
      } else if (url.includes('wishlist')) {
        message = 'Wishlist not found. The wishlist may have been deleted or the URL is incorrect.';
      } else if (url.includes('product')) {
        message = 'Product not found. The product may have been deleted or the URL is incorrect.';
      }
      
      console.error('404 Error:', {
        url,
        message
      });
      
      return Promise.reject({
        response: {
          status: 404,
          data: { message }
        }
      });
    }
    
    // Log all API errors for debugging
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

// Add handleApiError function
/**
 * Handles API errors consistently across the application
 * @param {Error} error - The error object from the API call
 * @param {string} customMessage - Optional custom message to display
 */
const handleApiError = (error, customMessage) => {
  const message = customMessage || 'An error occurred with the API request';
  console.error(message, error);
  
  // You could expand this to show toast messages, etc.
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
  }
  
  return error;
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login/', credentials),
  register: (userData) => api.post('/register/', userData),
  logout: () => api.post('/logout/'),
  getUser: () => api.get('/user/'),
};

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    try {
      return await api.get('/products/', { params });
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      return await api.get(`/product/${id}/`);
    } catch (error) {
      handleApiError(error);
      return { data: {} };
    }
  },
  
  getByCategory: async (categoryId, params = {}) => {
    try {
      return await api.get(`/products/?category=${categoryId}`, { params });
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },
  
  getFeatured: async () => {
    try {
      return await api.get('/products/featured/');
    } catch (error) {
      handleApiError(error);
      // Return empty array as data to prevent errors
      return { data: [] };
    }
  },
  
  getByVendor: (vendorId) => api.get(`/products/${vendorId}/`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories/'),
  getById: (id) => api.get(`/category/${id}/`),
};

// Customer API
export const customerAPI = {
  getAddresses: (customerId) => api.get(`/addresses/${customerId}/`),
  addAddress: (addressData) => api.post('/address/', addressData),
  updateAddress: (id, addressData) => api.put(`/address/${id}/`, addressData),
  deleteAddress: (id) => api.delete(`/address/${id}/`),
  getWishlist: (customerId) => api.get(`/wishlist/${customerId}/`),
  addToWishlist: (wishlistData) => api.post('/wishlistitem/', wishlistData),
  removeFromWishlist: (wishlistItemId) => api.delete(`/wishlistitem/${wishlistItemId}/`),
  removeFromWishlistByProduct: (customerId, productId) => api.delete(`/wishlistitem/?customer=${customerId}&product=${productId}`),
  getDashboard: (customerId) => api.get(`/customer/dashboard/${customerId}/`),
};

// Cart API - Using local storage for now, but structured for future backend integration
export const cartAPI = {
  // These methods will use local storage until backend endpoints are available
  getCart: () => {
    // This would normally be an API call, but for now we'll use localStorage
    return Promise.resolve({ data: JSON.parse(localStorage.getItem(STORAGE_KEYS.CART_DATA) || '[]') });
  },
  addToCart: (productId, quantity = 1) => {
    // This would normally be an API call
    return Promise.resolve({ data: { product_id: productId, quantity } });
  },
  removeFromCart: (productId) => {
    // This would normally be an API call
    return Promise.resolve({ data: { product_id: productId } });
  },
  updateQuantity: (productId, quantity) => {
    // This would normally be an API call
    return Promise.resolve({ data: { product_id: productId, quantity } });
  },
  clearCart: () => {
    // This would normally be an API call
    return Promise.resolve({ data: { success: true } });
  },
};

// Wishlist API - Using customerAPI methods but keeping the interface for backward compatibility
export const wishlistAPI = {
  getWishlist: (customerId) => {
    return api.get(`/wishlist/${customerId}/`);
  },
  addToWishlist: (wishlistData) => {
    return api.post('/wishlistitem/', wishlistData);
  },
  removeFromWishlist: (wishlistItemId) => {
    return api.delete(`/wishlistitem/${wishlistItemId}/`);
  },
  removeFromWishlistByProduct: (customerId, productId) => {
    return api.delete(`/wishlistitem/?customer=${customerId}&product=${productId}`);
  }
};

// Orders API
export const ordersAPI = {
  getOrders: () => api.get('/orders/'),
  getOrderById: (id) => api.get(`/order/${id}/`),
  createOrder: (orderData) => api.post('/orders/', orderData),
};

// Vendor API
export const vendorAPI = {
  getVendorDetails: () => api.get('/vendor/'),
  getProducts: () => api.get('/vendor/products/'),
  addProduct: (productData) => api.post('/products/', productData),
  updateProduct: (id, productData) => api.put(`/product/${id}/`, productData),
  deleteProduct: (id) => api.delete(`/product/${id}/`),
  addProductImage: (imageData) => api.post('/productimg/', imageData),
  deleteProductImage: (id) => api.delete(`/productimg/${id}/`),
  getDashboard: (vendorId) => api.get(`/vendor/dashboard/${vendorId}/`),
};

// Product Ratings API
export const ratingsAPI = {
  getProductRatings: (productId) => api.get(`/productrating/?product=${productId}`),
  addRating: (ratingData) => api.post('/productrating/', ratingData),
  updateRating: (id, ratingData) => api.put(`/productrating/${id}/`, ratingData),
  deleteRating: (id) => api.delete(`/productrating/${id}/`),
};

export default api; 