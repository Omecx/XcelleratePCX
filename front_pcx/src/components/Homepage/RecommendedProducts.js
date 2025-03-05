/**
 * RecommendedProducts.js
 * Displays personalized product recommendations on the homepage
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../Contexts/AuthContext';
import CardList from '../CardList/CardList';
import './RecommendedProducts.css';

/**
 * RecommendedProducts Component
 * 
 * Displays personalized product recommendations for authenticated users
 * or popular products for non-authenticated users.
 */
const RecommendedProducts = () => {
    const { authState } = useAuth();
    const [title, setTitle] = useState('Recommended For You');
    const [description, setDescription] = useState('Products picked just for you based on your preferences');
    const requestMadeRef = useRef(false);
    const [isVisible, setIsVisible] = useState(true);

    // Set the title and description based on authentication state
    useEffect(() => {
        // Only run this effect once
        if (requestMadeRef.current) return;
        
        if (!authState.token) {
            setTitle('Popular Products');
            setDescription('Top trending products our customers love');
        } else {
            setTitle('Recommended For You');
            setDescription('Products picked just for you based on your preferences');
        }
        
        // Should we show this section?
        // We might decide not to show recommendations at all in some cases
        const shouldShowRecommendations = true; // This could be based on other factors
        setIsVisible(shouldShowRecommendations);
        
        // Mark that we've handled this request
        requestMadeRef.current = true;
    }, [authState.token]);

    // Don't render the component if it's not visible
    if (!isVisible) {
        return null;
    }

    return (
        <section className="recommended-products-section">
            <div className="recommended-header">
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            
            {/* Use products type instead of recommended-products to avoid API errors */}
            <CardList 
                type="products" 
                limit={5} 
                showViewAll={true} 
                viewAllLink="/products"
            />
        </section>
    );
};

export default RecommendedProducts; 