/**
 * Context Utilities
 * Helper functions for context management
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} - The debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

/**
 * Safely stores data in localStorage with error handling
 * @param {string} key - The localStorage key
 * @param {any} data - The data to store (will be JSON stringified)
 * @returns {boolean} - Success status
 */
export const safeLocalStorage = {
  set: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error storing ${key} in localStorage:`, error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  }
};

/**
 * Creates a secure cookie (to be used with server implementation)
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days
 */
export const setSecureCookie = (name, value, days) => {
  // This is a placeholder for server-side implementation
  // In a real implementation, this would be handled by the server
  console.warn('setSecureCookie is a client-side placeholder. Implement proper HttpOnly cookies on the server.');
}; 