/**
 * CardList.js
 * Reusable component for displaying lists of cards (products, categories, vendors)
 */
import "./CardList.css";
import Card from "../PcxCard/PcxCard";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useApiData } from "../../Contexts/ApiDataContext";

// Cache system to prevent duplicate requests across component instances
const requestCache = {
  products: new Map(),
  categories: new Map(),
  'related-products': new Map(),
  'recommended-products': new Map(),
  'category-products': new Map(),
  'bundled-products': new Map(),
  'vendor': new Map(),
};

/**
 * CardList Component
 * Displays a list of cards with optional pagination
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Type of cards to display (products, categories, vendor, etc.)
 * @param {string} props.heading - Section heading
 * @param {string} props.url - URL for "See All" link
 * @param {boolean} props.showPagination - Whether to show pagination controls
 * @param {number} props.nItems - Number of items to display per page
 * @param {string} props.category_id - Category ID for filtered products
 * @param {string} props.category_slug - Category slug for URLs
 */
const CardList = (props) => {
    const { 
        fetchProducts, 
        fetchCategories, 
        fetchProductsByCategory,
        fetchRelatedProducts,
        fetchRecommendedProducts,
        fetchData,
        loading: apiLoading,
        error: apiError
    } = useApiData();

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [paginatedData, setPaginatedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dataFetchedRef = useRef(false);

    // Create or use a window-level registry for failed endpoints
    if (!window.__FAILED_ENDPOINTS) {
        window.__FAILED_ENDPOINTS = {};
    }
    
    // Global function to check if an endpoint has failed permanently
    const hasEndpointFailedPermanently = (endpoint) => {
        return window.__FAILED_ENDPOINTS[endpoint] && window.__FAILED_ENDPOINTS[endpoint].status === 404;
    };

    // Global function to register a failed endpoint
    const registerFailedEndpoint = (endpoint, status) => {
        console.warn(`CardList registering failed endpoint: ${endpoint} with status ${status}`);
        window.__FAILED_ENDPOINTS[endpoint] = {
            status,
            timestamp: Date.now()
        };
    };

    // Generate a unique cache key based on props
    const getCacheKey = useCallback(() => {
        const keyParts = [props.type];
        if (props.category_id) keyParts.push(props.category_id);
        if (props.product_id) keyParts.push(props.product_id);
        return keyParts.join('-');
    }, [props.type, props.category_id, props.product_id]);

    // Determine items per page based on screen size and card type
    const isSubProducts = props.type === "related-products" || props.type === "category-products";
    const itemsPerPage = useMemo(() => 
        isSubProducts ? getItemsPerPage(windowWidth) : props.nItems,
        [isSubProducts, windowWidth, props.nItems]
    );

    // Fetch data based on card type
    const fetchCardData = useCallback(async () => {
        // Prevent duplicate requests when component remounts
        if (dataFetchedRef.current) return;
        
        // Check cache first
        const cacheKey = getCacheKey();
        const cachedData = requestCache[props.type].get(cacheKey);
        
        // If we have cached data and it's less than 5 minutes old, use it
        const cacheTimeout = 5 * 60 * 1000; // 5 minutes
        if (cachedData && (Date.now() - cachedData.timestamp < cacheTimeout)) {
            setData(cachedData.data);
            setPaginatedData(cachedData.data.slice(0, itemsPerPage));
            setLoading(false);
            dataFetchedRef.current = true;
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            let result = [];
            
            // Create a helper function to handle API calls with fallback
            const safeApiCall = async (endpoint, primaryCall, fallbackCall = null, fallbackMessage = '') => {
                // Check if this endpoint has been marked as failed permanently
                if (endpoint && hasEndpointFailedPermanently(endpoint)) {
                    console.log(`Skipping request to known failed endpoint: ${endpoint}`);
                    return fallbackCall ? await fallbackCall() : [];
                }
                
                try {
                    return await primaryCall();
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        // Register the endpoint as failed
                        if (endpoint) {
                            registerFailedEndpoint(endpoint, 404);
                        }
                        
                        console.warn(fallbackMessage, error.message);
                        return fallbackCall ? await fallbackCall() : [];
                    }
                    throw error;
                }
            };
            
            switch (props.type) {
                case "products":
                    result = await safeApiCall(
                        '/api/products/',
                        () => fetchProducts(),
                        () => [], 
                        'Products endpoint not available:'
                    );
                    break;
                    
                case "categories":
                    result = await safeApiCall(
                        '/api/categories/',
                        () => fetchCategories(),
                        () => [],
                        'Categories endpoint not available:'
                    );
                    break;
                    
                case "related-products":
                    if (props.product_id) {
                        result = await safeApiCall(
                            `/api/related-products/?product_id=${props.product_id}`,
                            () => fetchRelatedProducts(props.product_id),
                            () => props.category_id ? fetchProductsByCategory(props.category_id) : [],
                            'Related products endpoint not available, falling back to category products:'
                        );
                    } else if (props.category_id) {
                        result = await safeApiCall(
                            `/api/products/?category_id=${props.category_id}`,
                            () => fetchProductsByCategory(props.category_id),
                            () => [],
                            'Category products endpoint not available:'
                        );
                    }
                    break;
                    
                case "recommended-products":
                    result = await safeApiCall(
                        '/api/products/recommended/',
                        () => fetchRecommendedProducts(props.nItems || 5),
                        () => fetchProducts({ limit: props.nItems || 5 }),
                        'Recommendations endpoint not available, falling back to regular products:'
                    );
                    
                    // If we got no recommendations, fallback to regular products
                    if (!result || result.length === 0) {
                        console.log('No recommendations available, falling back to regular products');
                        result = await fetchProducts({ limit: props.nItems || 5 });
                    }
                    break;
                    
                case "category-products":
                    if (props.category_id) {
                        result = await safeApiCall(
                            `/api/products/?category_id=${props.category_id}`,
                            () => fetchProductsByCategory(props.category_id),
                            () => [],
                            'Category products endpoint not available:'
                        );
                    }
                    break;
                    
                case "bundled-products":
                    // Fetch products that are frequently purchased together
                    if (props.product_id) {
                        result = await safeApiCall(
                            `/api/related-products/?product_id=${props.product_id}&relation_type=purchased_together`,
                            async () => {
                                const response = await fetchData(`/related-products/?product_id=${props.product_id}&relation_type=purchased_together`, 'GET');
                                if (response && Array.isArray(response)) {
                                    return response.map(item => item.target_product_details).filter(Boolean);
                                }
                                return [];
                            },
                            () => [],
                            'Bundled products endpoint not available:'
                        );
                    }
                    break;
                    
                case "vendor":
                    // Use the API service for vendors when implemented
                    result = await safeApiCall(
                        '/api/vendors/',
                        async () => {
                            const response = await fetchData('/vendors/', 'GET');
                            if (response && Array.isArray(response)) {
                                return response;
                            }
                            return [];
                        },
                        () => [],
                        'Vendors endpoint not available:'
                    );
                    break;
                    
                default:
                    console.warn(`Unknown card type: ${props.type}`);
                    break;
            }
            
            // Ensure we have an array
            if (!Array.isArray(result)) {
                console.warn(`Expected array result for ${props.type}, got:`, result);
                result = [];
            }
            
            // Update state with results
            setData(result);
            
            // Set initial paginated data
            setPaginatedData(result.slice(0, itemsPerPage));
            
            // Store in cache
            requestCache[props.type].set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            // Mark as fetched
            dataFetchedRef.current = true;
            
        } catch (err) {
            console.error(`Error fetching ${props.type} data:`, err);
            setError(`Failed to load ${props.type}. ${err.message}`);
            
            // Still mark as fetched to prevent repeated retries on errors
            dataFetchedRef.current = true;
            
            // Cache the error state
            requestCache[props.type].set(cacheKey, {
                data: [],
                timestamp: Date.now(),
                error: err.message
            });
        } finally {
            setLoading(false);
        }
    }, [
        props.type, 
        props.category_id, 
        props.product_id,
        props.nItems,
        fetchProducts, 
        fetchCategories, 
        fetchProductsByCategory, 
        fetchRelatedProducts, 
        fetchRecommendedProducts,
        fetchData,
        itemsPerPage,
        getCacheKey
    ]);

    // Fetch data on component mount and when dependencies change
    useEffect(() => {
        fetchCardData();
        
        // Reset the fetched flag when dependencies change
        return () => {
            dataFetchedRef.current = false;
        };
    }, [fetchCardData]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Update paginated data when page changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const visibleData = data.slice(startIndex, endIndex);
        setPaginatedData(visibleData);
    }, [currentPage, data, itemsPerPage]);

    // Calculate total pages
    const totalPages = Math.ceil(data.length / itemsPerPage);

    // Handle page change
    const handlePageChange = useCallback((newPage) => {
        setCurrentPage(newPage);
    }, []);

    // Show loading state
    if (loading || apiLoading) {
        return (
            <div className="card-list-section loading">
                <h3>{props.heading}</h3>
                <div className="loading-spinner">Loading {props.type}...</div>
            </div>
        );
    }

    // Show error state
    if (error || apiError) {
        return (
            <div className="card-list-section error">
                <h3>{props.heading}</h3>
                <div className="error-message">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {error || apiError || `Error loading ${props.type}`}
                </div>
            </div>
        );
    }

    return (
        <section className="card-list-section">
            <h3>{props.heading}</h3>
            
            {!props.showPagination && props.url && (
                <div className="btn-container">
                    <span>
                        <Link to={props.url}>
                            <button className="see-all-button">
                                See All
                                <FontAwesomeIcon id="arrow" icon={faArrowRight}/>
                            </button>
                        </Link>
                    </span>
                </div>
            )}
            
            <div className={`card-list ${props.type === "related-products" ? 'single-column' : ''}`}>
                {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                        <Card 
                            key={item.id} 
                            data={item} 
                            type={props.type} 
                            category_id={props.category_id} 
                            category_slug={props.category_slug}
                        />
                    ))
                ) : (
                    <div className="no-data">No {props.type.replace('-', ' ')} to display</div>
                )}
            </div>

            {props.showPagination && totalPages > 1 && (
                <div className="pagination" role="navigation" aria-label="Pagination">
                    {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;

                        // Display the first few pages and the last few pages
                        if (
                            page === 1 ||
                            page === 2 ||
                            page === totalPages ||
                            page === totalPages - 1 ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                            return (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(page)}
                                    className={currentPage === page ? 'active' : ''}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                    aria-label={`Page ${page}`}
                                >
                                    {page}
                                </button>
                            );
                        }

                        // Display ellipsis for pages in between
                        if (
                            page === 3 ||
                            page === totalPages - 2 ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                            return <span key={index} className="ellipsis">...</span>;
                        }

                        return null;
                    })}
                </div>
            )}
        </section>
    );
};

/**
 * Calculate items per page based on window width
 * 
 * @param {number} windowWidth - Current window width
 * @returns {number} - Number of items to display per page
 */
function getItemsPerPage(windowWidth) {
    if (windowWidth <= 415) {
        return 1;
    } else if (windowWidth <= 1100) {
        return 3;
    } else {
        return 5;
    }
}

export default CardList;