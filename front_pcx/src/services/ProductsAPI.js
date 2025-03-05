import axios from 'axios';
import { API_BASE_URL } from '../config';

// Global registry for failed endpoints
if (!window.__FAILED_ENDPOINTS) {
    window.__FAILED_ENDPOINTS = {};
}

class ProductsAPI {
    constructor() {
        this.baseURL = `${API_BASE_URL}/products`;
        this.pendingRequests = {};
    }

    // Helper to check if an endpoint has failed permanently
    hasEndpointFailedPermanently(endpoint) {
        return window.__FAILED_ENDPOINTS[endpoint] && 
               window.__FAILED_ENDPOINTS[endpoint].status === 404;
    }

    // Helper to register a failed endpoint
    registerFailedEndpoint(endpoint, status) {
        console.warn(`ProductsAPI registering failed endpoint: ${endpoint} with status ${status}`);
        window.__FAILED_ENDPOINTS[endpoint] = {
            status,
            timestamp: Date.now()
        };
    }

    // Helper to prevent duplicate in-flight requests
    async makeRequest(endpoint, config = {}) {
        const requestKey = `${config.method || 'GET'}:${endpoint}`;
        
        // Check if endpoint has failed permanently
        if (this.hasEndpointFailedPermanently(endpoint)) {
            console.log(`ProductsAPI: Skipping request to known failed endpoint: ${endpoint}`);
            return Promise.reject({
                response: { status: 404 },
                message: 'Endpoint previously returned 404 Not Found'
            });
        }
        
        // Check if request is already in progress
        if (this.pendingRequests[requestKey]) {
            console.log(`ProductsAPI: Request already in progress for ${endpoint}`);
            return this.pendingRequests[requestKey];
        }
        
        // Create the request promise
        const requestPromise = (async () => {
            try {
                const response = await axios({
                    ...config,
                    url: endpoint
                });
                delete this.pendingRequests[requestKey];
                return response;
            } catch (error) {
                delete this.pendingRequests[requestKey];
                
                // Register 404 errors
                if (error.response && error.response.status === 404) {
                    this.registerFailedEndpoint(endpoint, 404);
                }
                
                throw error;
            }
        })();
        
        // Store the promise
        this.pendingRequests[requestKey] = requestPromise;
        return requestPromise;
    }

    // Get all products with optional filters
    async getAll(params = {}) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value);
        });
        
        const endpoint = `${this.baseURL}/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return this.makeRequest(endpoint);
    }

    // Get featured products
    async getFeatured() {
        const endpoint = `${this.baseURL}/featured/`;
        
        // If we know this endpoint fails, immediately use fallback
        if (this.hasEndpointFailedPermanently(endpoint)) {
            console.log('ProductsAPI: Featured endpoint known to fail, using fallback immediately');
            return this.getAll({ limit: 5, sort: 'popularity' });
        }
        
        try {
            return await this.makeRequest(endpoint);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.warn('Featured products endpoint not available, using fallback');
                return this.getAll({ limit: 5, sort: 'popularity' });
            }
            throw error;
        }
    }

    // Get products by category
    async getByCategory(categoryId, params = {}) {
        const queryParams = new URLSearchParams();
        queryParams.append('category_id', categoryId);
        
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value);
        });
        
        const endpoint = `${this.baseURL}/?${queryParams.toString()}`;
        return this.makeRequest(endpoint);
    }

    // Get product by ID
    async getById(productId) {
        const endpoint = `${this.baseURL}/${productId}/`;
        return this.makeRequest(endpoint);
    }

    // Get recommended products
    async getRecommended(limit = 5) {
        const endpoint = `${this.baseURL}/recommended/?limit=${limit}`;
        
        // If we know this endpoint fails, immediately use fallback
        if (this.hasEndpointFailedPermanently(endpoint)) {
            console.log('ProductsAPI: Recommended endpoint known to fail, using fallback immediately');
            return this.getAll({ limit, sort: 'popularity' });
        }
        
        try {
            return await this.makeRequest(endpoint);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.warn('Recommended products endpoint not available, using fallback');
                return this.getAll({ limit, sort: 'popularity' });
            }
            throw error;
        }
    }

    // Get related products
    async getRelated(productId, relationType = 'similar') {
        const endpoint = `${API_BASE_URL}/related-products/?product_id=${productId}&relation_type=${relationType}`;
        
        // If we know this endpoint fails, immediately use fallback
        if (this.hasEndpointFailedPermanently(endpoint)) {
            console.log('ProductsAPI: Related products endpoint known to fail, using fallback immediately');
            return this.getAll({ limit: 5 });
        }
        
        try {
            return await this.makeRequest(endpoint);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.warn('Related products endpoint not available, using fallback');
                return this.getAll({ limit: 5 });
            }
            throw error;
        }
    }
}

// Create a singleton instance
const productsAPI = new ProductsAPI();
export default productsAPI; 