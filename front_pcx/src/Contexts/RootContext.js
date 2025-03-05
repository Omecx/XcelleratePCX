/**
 * RootContext.js
 * Consolidates all context providers into a single component
 */
import React from 'react';
import { CartContextProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { CardListProvider } from './CardListContext';
import { PaginationProvider } from './PaginationContext';
import { ToggleContextProvider } from './ToggleContext';

/**
 * Root Context Provider Component
 * Wraps all context providers in a single component to avoid excessive nesting
 * AuthProvider and ApiDataProvider are now handled in App.js to solve dependency issues
 */
export function RootContextProvider({ children }) {
  return (
    <CartContextProvider>
      <WishlistProvider>
        <CardListProvider>
          <PaginationProvider>
            <ToggleContextProvider>
              {children}
            </ToggleContextProvider>
          </PaginationProvider>
        </CardListProvider>
      </WishlistProvider>
    </CartContextProvider>
  );
}

export default RootContextProvider; 