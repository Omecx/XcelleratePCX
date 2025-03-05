/**
 * CartContext.js
 * Provides cart state and operations throughout the application
 */
import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "./config";
import { safeLocalStorage } from "../utils/contextUtils";
import { cartAPI } from "../services/api";
import { useAuth } from "./AuthContext";
import { useApiData } from "./ApiDataContext";

// Create context
const CartContext = createContext();

// Action types
const CART_ACTIONS = {
  SET_CART: 'SET_CART',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  loading: false,
  error: null,
};

// Helper functions
const calculateCartTotals = (items) => {
  return {
    totalItems: items.reduce((total, item) => total + (item.quantity || 1), 0),
    totalPrice: items.reduce((total, item) => total + (item.product.price * (item.quantity || 1)), 0),
  };
};

// Reducer function
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload,
        ...calculateCartTotals(action.payload),
        loading: false,
        error: null,
      };
    case CART_ACTIONS.ADD_ITEM: {
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(item => item.product.id === action.payload.product.id);
      
      let newItems;
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + action.payload.quantity,
        };
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }
      
      return {
        ...state,
        items: newItems,
        ...calculateCartTotals(newItems),
        loading: false,
        error: null,
      };
    }
    case CART_ACTIONS.REMOVE_ITEM: {
      const newItems = state.items.filter(item => item.product.id !== action.payload);
      
      return {
        ...state,
        items: newItems,
        ...calculateCartTotals(newItems),
        loading: false,
        error: null,
      };
    }
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;
      
      // Find the item
      const existingItemIndex = state.items.findIndex(item => item.product.id === productId);
      
      // If item doesn't exist, return current state
      if (existingItemIndex < 0) {
        return state;
      }
      
      // Create new items array with updated quantity
      const newItems = [...state.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity,
      };
      
      return {
        ...state,
        items: newItems,
        ...calculateCartTotals(newItems),
        loading: false,
        error: null,
      };
    }
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        loading: false,
        error: null,
      };
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      };
    case CART_ACTIONS.SET_ERROR:
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
 * CartContextProvider Component
 */
export const CartContextProvider = ({ children }) => {
  const { authState } = useAuth();
  const { isAuthenticated, userId, customerId } = authState;
  const apiData = useApiData();  // Get the API data context
  
  // Initialize state from storage or default
  const storedCart = safeLocalStorage.get(STORAGE_KEYS.CART_DATA, []);
  const [cartState, dispatch] = useReducer(cartReducer, {
    ...initialState,
    items: storedCart,
    ...calculateCartTotals(storedCart),
  });
  
  // Update storage when cart changes
  useEffect(() => {
    if (!isAuthenticated) {
      safeLocalStorage.set(STORAGE_KEYS.CART_DATA, cartState.items);
    }
  }, [cartState.items, isAuthenticated]);
  
  // Fetch cart from API when authenticated
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await cartAPI.getCart();
      dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
    } catch (error) {
      console.error('Error fetching cart:', error);
      dispatch({ 
        type: CART_ACTIONS.SET_ERROR, 
        payload: error.response?.data?.message || 'Failed to fetch cart' 
      });
    }
  }, [isAuthenticated]);
  
  // Fetch cart on auth state change
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // If not authenticated, use local storage
      const storedItems = safeLocalStorage.get(STORAGE_KEYS.CART_DATA, []);
      dispatch({ type: CART_ACTIONS.SET_CART, payload: storedItems });
    }
  }, [isAuthenticated, fetchCart]);
  
  // Add item to cart
  const addToCart = useCallback(async (product, quantity = 1) => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
    
    const cartItem = {
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image || product.thumbnail,
      },
      quantity,
      user: {
        id: userId || 'anonymous',
      },
    };
    
    // Optimistically update UI
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: cartItem });
    
    // Track this interaction for recommendations
    try {
      if (typeof apiData?.trackCartAdd === 'function') {
        apiData.trackCartAdd(product.id);
      }
    } catch (error) {
      console.error('Failed to track cart interaction:', error);
      // Don't fail the cart add if tracking fails
    }
    
    // Sync with API if authenticated
    if (isAuthenticated && customerId) {
      try {
        await cartAPI.addToCart(product.id, quantity);
      } catch (error) {
        dispatch({ 
          type: CART_ACTIONS.SET_ERROR, 
          payload: error.response?.data?.message || 'Failed to add item to cart' 
        });
        // Revert optimistic update by fetching current state
        fetchCart();
      }
    }
  }, [isAuthenticated, userId, customerId, fetchCart, apiData]);
  
  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
    
    // Optimistically update UI
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: productId });
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      try {
        await cartAPI.removeFromCart(productId);
      } catch (error) {
        dispatch({ 
          type: CART_ACTIONS.SET_ERROR, 
          payload: error.response?.data?.message || 'Failed to remove item from cart' 
        });
        // Revert optimistic update by fetching current state
        fetchCart();
      }
    }
  }, [isAuthenticated, fetchCart]);
  
  // Update item quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
    
    // Optimistically update UI
    dispatch({ 
      type: CART_ACTIONS.UPDATE_QUANTITY, 
      payload: { productId, quantity } 
    });
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      try {
        await cartAPI.updateQuantity(productId, quantity);
      } catch (error) {
        dispatch({ 
          type: CART_ACTIONS.SET_ERROR, 
          payload: error.response?.data?.message || 'Failed to update quantity' 
        });
        // Revert optimistic update by fetching current state
        fetchCart();
      }
    }
  }, [isAuthenticated, fetchCart]);
  
  // Clear cart
  const clearCart = useCallback(async () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    
    // Sync with API if authenticated
    if (isAuthenticated) {
      try {
        await cartAPI.clearCart();
      } catch (error) {
        dispatch({ 
          type: CART_ACTIONS.SET_ERROR, 
          payload: error.response?.data?.message || 'Failed to clear cart' 
        });
        // Revert optimistic update by fetching current state
        fetchCart();
      }
    }
  }, [isAuthenticated, fetchCart]);
  
  // Check if product is in cart
  const isInCart = useCallback((productId) => {
    return cartState.items.some(item => item.product.id === productId);
  }, [cartState.items]);
  
  // Context value
  const value = {
    items: cartState.items,
    totalItems: cartState.totalItems,
    totalPrice: cartState.totalPrice,
    loading: cartState.loading,
    error: cartState.error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    fetchCart,
    isInCart,
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

/**
 * Custom hook to use the cart context
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartContextProvider');
  }
  return context;
};