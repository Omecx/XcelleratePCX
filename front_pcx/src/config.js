/**
 * config.js
 * Centralized configuration file for the application
 * Uses environment variables with fallbacks
 */

const config = {
    // API Configuration
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || '/api',
    API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT, 10) || 30000,
    
    // Authentication
    AUTH_TOKEN_KEY: process.env.REACT_APP_AUTH_TOKEN_KEY || 'pcx_auth_token',
    USER_INFO_KEY: process.env.REACT_APP_USER_INFO_KEY || 'pcx_user_info',
    
    // Cache Configuration
    CACHE_DURATION: {
        SHORT: parseInt(process.env.REACT_APP_CACHE_DURATION_SHORT, 10) || 300000,    // 5 minutes
        MEDIUM: parseInt(process.env.REACT_APP_CACHE_DURATION_MEDIUM, 10) || 1800000, // 30 minutes
        LONG: parseInt(process.env.REACT_APP_CACHE_DURATION_LONG, 10) || 3600000,    // 1 hour
    },
    
    // Analytics
    ANALYTICS_ID: process.env.REACT_APP_ANALYTICS_ID,
    
    // Feature Flags
    FEATURES: {
        ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
        ERROR_TRACKING: process.env.REACT_APP_ENABLE_ERROR_TRACKING === 'true',
        PERFORMANCE_MONITORING: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
    },
    
    // Development Settings
    DEBUG: {
        LOGGING: process.env.REACT_APP_ENABLE_DEBUG_LOGGING === 'true',
        MOCK_API: process.env.REACT_APP_ENABLE_MOCK_API === 'true',
    },
    
    // API Endpoints
    ENDPOINTS: {
        PRODUCTS: '/products',
        CATEGORIES: '/categories',
        FEATURED: '/products/featured',
        RECOMMENDED: '/recommendations',
        POPULAR: '/products/popular',
        VENDORS: '/vendors',
        CUSTOMER: '/customer',
        VENDOR: '/vendor',
        AUTH: '/auth',
        ANALYTICS: '/analytics',
    },
    
    // Error Messages
    ERRORS: {
        NETWORK: 'Network error. Please check your connection.',
        UNAUTHORIZED: 'Please log in to continue.',
        FORBIDDEN: 'You do not have permission to perform this action.',
        NOT_FOUND: 'The requested resource was not found.',
        SERVER: 'Server error. Please try again later.',
        VALIDATION: 'Please check your input and try again.',
    },
    
    // UI Configuration
    UI: {
        ITEMS_PER_PAGE: 10,
        MAX_RETRIES: 3,
        RETRY_DELAY: 2000,
        LOADING_TIMEOUT: 5000,
    },
    
    // Cache Keys
    CACHE_KEYS: {
        PRODUCTS: 'products',
        CATEGORIES: 'categories',
        FEATURED: 'featured',
        RECOMMENDED: 'recommended',
        POPULAR: 'popular',
        VENDORS: 'vendors',
        USER: 'user',
    },
};

// Validate required environment variables
const requiredEnvVars = [
    'REACT_APP_API_BASE_URL',
];

const missingEnvVars = requiredEnvVars.filter(
    envVar => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
    console.warn(
        'Missing required environment variables:',
        missingEnvVars.join(', ')
    );
}

export default config; 