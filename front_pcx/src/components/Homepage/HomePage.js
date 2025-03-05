/**
 * HomePage.js
 * Main landing page component for the application
 */
import './HomePage.css';
import CardList from '../CardList/CardList';
import Carousal from '../CarousalPcx/CarousalPcx';
// Import data from a new location if available, otherwise create placeholder data
// import { offers, popularReviews } from '../rejCar/CarousalData';
import { useEffect, useState, useRef } from 'react';
import productsAPI from '../../services/ProductsAPI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import RecommendedProducts from './RecommendedProducts';
import { placeholderOffers, placeholderReviews } from '../../utils/placeholders';

/**
 * HomePage Component
 * Displays the main landing page with featured content sections
 */
export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviews] = useState(placeholderReviews);
    const featuredProductsRequestRef = useRef(false);
    const errorEncounteredRef = useRef(false);
    
    // Create a static variable to track 404 errors across component remounts
    // This ensures we don't attempt the same failed request if the component is remounted
    if (!window.__FAILED_ENDPOINTS) {
        window.__FAILED_ENDPOINTS = {};
    }
    
    // Fetch featured products for the carousel
    useEffect(() => {
        // Skip if already fetched or if we've already encountered an error
        if (featuredProductsRequestRef.current) return;
        
        // Check if this endpoint has failed in the past (across component remounts)
        if (window.__FAILED_ENDPOINTS['/api/products/featured/']) {
            console.log('Featured products endpoint previously failed, skipping request');
            setFeaturedProducts(placeholderOffers);
            setLoading(false);
            featuredProductsRequestRef.current = true;
            return;
        }
        
        // Don't retry if we've already encountered a 404 error in this session
        if (errorEncounteredRef.current) return;
        
        const fetchFeaturedProducts = async () => {
            try {
                setLoading(true);
                
                // Use fallback method - get regular products and mark them as featured
                // This is a workaround for the missing /api/products/featured/ endpoint
                let response;
                try {
                    // First try the official featured products endpoint
                    response = await productsAPI.getFeatured();
                } catch (featuredError) {
                    console.warn('Featured products endpoint not available, using regular products instead:', featuredError.message);
                    // If 404, mark that we've encountered this error to avoid retrying
                    if (featuredError.response && featuredError.response.status === 404) {
                        errorEncounteredRef.current = true;
                        // Register this failure for future component instances
                        window.__FAILED_ENDPOINTS['/api/products/featured/'] = {
                            status: 404,
                            timestamp: Date.now()
                        };
                        // Use regular products as a fallback
                        response = await productsAPI.getAll({ limit: 5 });
                    } else {
                        // For other errors, rethrow
                        throw featuredError;
                    }
                }
                
                // Transform the data for the carousel
                const carouselData = response.data.map(product => ({
                    src: product.image_url || product.thumbnail || placeholderOffers[0].src,
                    alt: product.title || 'Featured product',
                    id: product.id,
                    name: product.title || 'Featured product',
                    price: product.price || '0.00'
                }));
                
                setFeaturedProducts(carouselData);
            } catch (error) {
                console.error('Error fetching featured products:', error);
                // Mark that we've encountered an error to prevent retries
                errorEncounteredRef.current = true;
                // Use placeholder offers if API fails
                setFeaturedProducts(placeholderOffers);
            } finally {
                setLoading(false);
                featuredProductsRequestRef.current = true;
            }
        };
        
        fetchFeaturedProducts();
        
        // Cleanup function to reset the ref when component unmounts
        return () => {
            featuredProductsRequestRef.current = false;
            // Don't reset the errorEncounteredRef or window.__FAILED_ENDPOINTS
            // If the endpoint doesn't exist, it won't suddenly start working on remount
        };
    }, []);
    
    return (
        <div className="homePage-cont">
            <section className="carousel-container">
                {loading ? (
                    <div className="carousel-loading">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <p>Loading featured products...</p>
                    </div>
                ) : (
                    <Carousal 
                        data={featuredProducts.length > 0 ? featuredProducts : placeholderOffers} 
                        type='offers'
                    />
                )}
            </section>
            
            <section className="popularProducts">
                <CardList 
                    type="products" 
                    heading="Customer Favorites" 
                    url="/products" 
                    showPagination={true} 
                    nItems={3}
                />
            </section>
            
            <section className="popularCategories">
                <CardList 
                    type="categories" 
                    heading="In-Demand Sections" 
                    url="/categories" 
                    showPagination={true} 
                    nItems={3}
                />
            </section>
            
            <section className="popularSellers">
                <CardList 
                    type="vendor" 
                    heading="Trusted Retailers" 
                    url="/vendors" 
                    showPagination={true} 
                    nItems={3}
                />
            </section>
            
            <section className="latestReviews">
                <h3>Notable Testimonials</h3>
                <Carousal data={reviews} type='reviews' />
            </section>
            
            <RecommendedProducts />
        </div>
    );
}
