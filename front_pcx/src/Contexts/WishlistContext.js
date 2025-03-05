/**
 * WishlistContext.js
 * Provides wishlist state and operations throughout the application
 */
import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "./config";
import { safeLocalStorage } from "../utils/contextUtils";
import { wishlistAPI } from "../services/api";
import { useAuth } from "./AuthContext";
import { useApiData } from "./ApiDataContext";

// Create context
const WishlistContext = createContext();

// Action types
const WISHLIST_ACTIONS = {
  SET_WISHLIST: 'SET_WISHLIST',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_WISHLIST: 'CLEAR_WISHLIST',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Initial state
const initialState = {
  items: [],
  loading: false,
  error: null,
};

// Reducer function
const wishlistReducer = (state, action) => {
  switch (action.type) {
    case WISHLIST_ACTIONS.SET_WISHLIST:
      return {
        ...state,
        items: action.payload,
        loading: false,
        error: null,
      };
    case WISHLIST_ACTIONS.ADD_ITEM: {
      // Check if item already exists
      const exists = state.items.some(item => item.product.id === action.payload.product.id);
      if (exists) {
        return state; // Item already in wishlist
      }
      
      return {
        ...state,
        items: [...state.items, action.payload],
        loading: false,
        error: null,
      };
    }
    case WISHLIST_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.payload),
        loading: false,
        error: null,
      };
    case WISHLIST_ACTIONS.CLEAR_WISHLIST:
      return {
        ...state,
        items: [],
        loading: false,
        error: null,
      };
    case WISHLIST_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      };
    case WISHLIST_ACTIONS.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

/**
 * WishlistProvider Component
 */
export const WishlistProvider = ({ children }) => {
  const { authState } = useAuth();
  const { isAuthenticated, userId, customerId } = authState;
  const apiData = useApiData();  // Get the API data context
  
  // Initialize state from storage or default
  const storedWishlist = safeLocalStorage.get(STORAGE_KEYS.WISHLIST_DATA, []);
  const [state, dispatch] = useReducer(wishlistReducer, {
    ...initialState,
    items: storedWishlist,
  });
  
  // Update storage when wishlist changes
  useEffect(() => {
    if (!isAuthenticated) {
      safeLocalStorage.set(STORAGE_KEYS.WISHLIST_DATA, state.items);
    }
  }, [state.items, isAuthenticated]);
  
  // Fetch wishlist from API when authenticated
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || !customerId) return;
    
    dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await wishlistAPI.getWishlist(customerId);
      const wishlistItems = response.data || [];
      
      // Transform API data to match our state structure if needed
      const formattedItems = wishlistItems.map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          image: item.product.thumbnail || item.product.image,
        },
        added_at: item.added_at,
      }));
      
      dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: formattedItems });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to fetch wishlist';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 404) {
          errorMessage = 'Wishlist not found. Please try again later.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else {
          errorMessage = error.response.data?.message || 
                        error.response.data?.msg || 
                        `Error ${error.response.status}: Failed to fetch wishlist`;
        }
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      dispatch({ 
        type: WISHLIST_ACTIONS.SET_ERROR, 
        payload: errorMessage
      });
      
      // If there's a network error or server error, use local storage as fallback
      const storedItems = safeLocalStorage.get(STORAGE_KEYS.WISHLIST_DATA, []);
      if (storedItems.length > 0) {
        dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: storedItems });
      }
    } finally {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: false });
    }
  }, [isAuthenticated, customerId]);
  
  // Fetch wishlist on auth state change
  useEffect(() => {
    if (isAuthenticated && customerId) {
      fetchWishlist();
    } else {
      // If not authenticated, use local storage
      const storedItems = safeLocalStorage.get(STORAGE_KEYS.WISHLIST_DATA, []);
      dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: storedItems });
    }
  }, [isAuthenticated, customerId, fetchWishlist]);
  
  // Add item to wishlist
  const addToWishlist = useCallback(async (product) => {
    dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
    
    const wishlistItem = {
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image || product.thumbnail,
      },
      user: {
        id: userId || 'anonymous',
      },
    };
    
    // Optimistically update UI
    dispatch({ type: WISHLIST_ACTIONS.ADD_ITEM, payload: wishlistItem });
    
    // Track this interaction for recommendations
    try {
      if (typeof apiData?.trackWishlistAdd === 'function') {
        apiData.trackWishlistAdd(product.id);
      }
    } catch (error) {
      console.error('Failed to track wishlist interaction:', error);
      // Don't fail the wishlist add if tracking fails
    }
    
    // Sync with API if authenticated
    if (isAuthenticated && customerId) {
      try {
        // Create wishlist item data
        const wishlistData = {
          customer: customerId,
          product: product.id
        };
        
        await wishlistAPI.addToWishlist(wishlistData);
      } catch (error) {
        dispatch({ 
          type: WISHLIST_ACTIONS.SET_ERROR, 
          payload: error.response?.data?.message || 'Failed to add item to wishlist' 
        });
        // Revert optimistic update by fetching current state
        fetchWishlist();
      }
    }
  }, [isAuthenticated, userId, customerId, fetchWishlist, apiData]);
  
  // Remove item from wishlist
  const removeFromWishlist = useCallback(async (productId) => {
    dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
    
    // Sync with API if authenticated
    if (isAuthenticated && customerId) {
      try {
        // Find the wishlist item ID if available
        const wishlistItem = state.items.find(item => item.product.id === productId);
        
        if (wishlistItem) {
          // If we have the wishlist item ID, use it
          if (wishlistItem.id) {
            await wishlistAPI.removeFromWishlist(wishlistItem.id);
          } else {
            // Otherwise, use the customer ID and product ID
            await wishlistAPI.removeFromWishlistByProduct(customerId, productId);
          }
          
          // Update UI after successful API call
          dispatch({ type: WISHLIST_ACTIONS.REMOVE_ITEM, payload: productId });
        } else {
          console.warn('Wishlist item not found for product:', productId);
          dispatch({ 
            type: WISHLIST_ACTIONS.SET_ERROR, 
            payload: 'Item not found in wishlist'
          });
        }
      } catch (error) {
        console.error('Error removing from wishlist:', error);
        dispatch({ 
          type: WISHLIST_ACTIONS.SET_ERROR, 
          payload: error.response?.data?.message || 'Failed to remove item from wishlist' 
        });
      } finally {
        dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: false });
      }
    } else {
      // For unauthenticated users, just update local state
      dispatch({ type: WISHLIST_ACTIONS.REMOVE_ITEM, payload: productId });
    }
  }, [isAuthenticated, customerId, state.items]);
  
  // Check if product is in wishlist
  const isInWishlist = useCallback((productId) => {
    return state.items.some(item => item.product.id === productId);
  }, [state.items]);
  
  // Clear wishlist
  const clearWishlist = useCallback(() => {
    dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
  }, []);
  
  // Context value
  const value = {
    ...state,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    fetchWishlist,
    isInWishlist,
  };
  
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

/**
 * Custom hook to use the wishlist context
 */
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};