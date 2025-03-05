/**
 * ProductDetailPage.js
 * Displays detailed information about a product
 */
import './ProductDetailPage.css'
import { Link, useParams, useNavigate } from 'react-router-dom';
import CardList from "../CardList/CardList";
// Remove import from rejCar
// import { offers } from '../rejCar/CarousalData';
import Carousal from '../CarousalPcx/CarousalPcx';
import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
// import { popularReviews } from '../rejCar/CarousalData';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus, faCartShopping, faHeart, faHeartBroken, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useCart } from '../../Contexts/CartContext';
import { useWishlist } from '../../Contexts/WishlistContext';
import { useApiData } from '../../Contexts/ApiDataContext';
import { useAuth } from '../../Contexts/AuthContext';
import ProductBundles from './ProductBundles';

/**
 * ProductDetailPage Component
 * Displays detailed information about a product and related actions
 */
const ProductDetailPage = () => {
    const { product_id } = useParams();
    const { 
      addToCart, 
      removeFromCart, 
      isInCart, 
      loading: cartLoading 
    } = useCart();
    
    const { 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist, 
      loading: wishlistLoading 
    } = useWishlist();
    
    const { 
        fetchProductDetails, 
        trackProductView, 
        loading: apiLoading, 
        error: apiError 
    } = useApiData();

    const [product, setProduct] = useState(null);
    const [inCart, setInCart] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [productImages, setProductImages] = useState([]);

    // Fetch product details
    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                const productData = await fetchProductDetails(product_id);
                
                if (productData) {
                    setProduct(productData);
                    setInCart(isInCart(productData.id));
                    setInWishlist(isInWishlist(productData.id));
                    
                    // Prepare images for carousel
                    const images = [];
                    
                    // Add thumbnail as first image
                    if (productData.thumbnail) {
                        images.push({
                            src: productData.thumbnail,
                            alt: productData.title,
                            id: 'thumbnail',
                        });
                    }
                    
                    // Add product images
                    if (productData.product_images && productData.product_images.length > 0) {
                        productData.product_images.forEach((img, index) => {
                            images.push({
                                src: img.image,
                                alt: `${productData.title} image ${index + 1}`,
                                id: img.id || `image-${index}`,
                            });
                        });
                    }
                    
                    setProductImages(images);
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                setError('Failed to load product details');
                console.error('Error fetching product:', err);
            } finally {
                setLoading(false);
            }
        };
        
        loadProduct();
    }, [product_id, fetchProductDetails, isInCart, isInWishlist]);

    // Handle cart actions
    const handleCartToggle = useCallback(async () => {
        if (!product) return;
        
        try {
            if (inCart) {
                await removeFromCart(product.id);
            } else {
                await addToCart(product);
            }
            setInCart(!inCart);
        } catch (err) {
            // Error is handled by the context
        }
    }, [product, inCart, addToCart, removeFromCart]);

    // Handle wishlist actions
    const handleWishlistToggle = useCallback(async () => {
        if (!product) return;
        
        try {
            if (inWishlist) {
                await removeFromWishlist(product.id);
            } else {
                await addToWishlist(product);
            }
            setInWishlist(!inWishlist);
        } catch (err) {
            // Error is handled by the context
        }
    }, [product, inWishlist, addToWishlist, removeFromWishlist]);

    // Handle buy now action
    const handleBuyNow = useCallback(() => {
        if (!product) return;
        
        // Add to cart if not already there
        if (!inCart) {
            addToCart(product);
            setInCart(true);
        }
        
        // Navigate to checkout
        window.location.href = '/checkout';
    }, [product, inCart, addToCart]);

    // Show loading state
    if (loading || apiLoading) {
        return (
            <div className="pdpage loading-container">
                <div className="loading-spinner">Loading product details...</div>
            </div>
        );
    }

    // Show error state
    if (error || apiError) {
        return (
            <div className="pdpage error-container">
                <div className="error-message">
                    {error || apiError || 'An error occurred while loading the product'}
                </div>
                <Link to="/products" className="back-link">
                    Back to Products
                </Link>
            </div>
        );
    }

    // Show product not found
    if (!product) {
        return (
            <div className="pdpage not-found-container">
                <div className="not-found-message">
                    Product not found
                </div>
                <Link to="/products" className="back-link">
                    Back to Products
                </Link>
            </div>
        );
    }

    return (
        <main className="pdpage" aria-label={`Product details for ${product.title}`}>
            <div className="product-detail-cont">
                <section className="product-img-cont">
                    <Carousal data={productImages.length > 0 ? productImages : []} type='product'/>
                    <hr className="divider" />
                </section>
                
                <section className="product-main">
                    <h1>{product.title}</h1>
                    <p>{product.detail}</p>
                    <h3 className="product-price">{product.price}</h3>
                    <hr className="divider" />
                    <h3>
                        <Link to={`/category/${product.category}/${product.category_id || ''}`}>
                            {product.category}
                        </Link>
                    </h3>
                </section>
                
                <section className="button-cont-pdpage">
                    <button 
                        className={inCart ? "Remove-cart" : "Add-cart"} 
                        id="btn-1" 
                        onClick={handleCartToggle}
                        disabled={cartLoading}
                        aria-busy={cartLoading}
                        aria-label={inCart ? "Remove from cart" : "Add to cart"}
                    >
                        <FontAwesomeIcon 
                            id="ic-pdpage" 
                            icon={faCartPlus} 
                            className="cartIcon" 
                        />
                        {inCart ? "Remove from Cart" : "Add to Cart"}
                    </button>
                    
                    <button 
                        className="Buy-now" 
                        id="btn-2"
                        onClick={handleBuyNow}
                        disabled={cartLoading}
                        aria-busy={cartLoading}
                        aria-label="Buy now"
                    >
                        <FontAwesomeIcon 
                            id="ic-pdpage" 
                            icon={faCartShopping} 
                            className="cartIcon" 
                        />
                        Buy Now
                    </button>
                    
                    <button 
                        className={inWishlist ? "Remove-wishlist" : "WishList"} 
                        id="btn-3" 
                        onClick={handleWishlistToggle}
                        disabled={wishlistLoading}
                        aria-busy={wishlistLoading}
                        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <FontAwesomeIcon 
                            id="ic-pdpage" 
                            icon={inWishlist ? faHeartBroken : faHeart} 
                            className="wishListIcon" 
                        /> 
                        {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                    </button>
                </section>
                
                {/* Product Bundles section */}
                <ProductBundles productId={product.id} />
                
                {/* Related Products section */}
                <section className="related-products">
                    <h2>Related Products</h2>
                    <CardList 
                        type="related-products"
                        product_id={product.id} 
                        showPagination={false}
                        nItems={5}
                    />
                </section>
            </div>
        </main>
    );
};

export default ProductDetailPage;