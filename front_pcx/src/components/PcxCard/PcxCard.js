/**
 * PcxCard.js
 * Reusable card component for displaying products, vendors, and categories
 */
import './PcxCard.css';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faCartPlus, 
    faCartArrowDown, 
    faHeartCircleMinus, 
    faHeartCirclePlus 
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from '../../Contexts/CartContext';
import { useWishlist } from '../../Contexts/WishlistContext';

/**
 * PcxCard Component
 * Displays a card with product, vendor, or category information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Data to display in the card
 * @param {string} props.type - Type of card (products, vendor, categories, etc.)
 * @param {string} props.category_id - Category ID for related products
 * @param {string} props.category_slug - Category slug for URLs
 */
const PcxCard = (props) => {
    const { addToCart, removeFromCart, isInCart, loading: cartLoading } = useCart();
    const { 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist, 
        loading: wishlistLoading 
    } = useWishlist();
    
    const [inWishlist, setInWishlist] = useState(false);
    const [inCart, setInCart] = useState(false);
    
    // Check if product is in wishlist and cart on mount
    useEffect(() => {
        if (props.data?.id) {
            setInWishlist(isInWishlist(props.data.id));
            setInCart(isInCart(props.data.id));
        }
    }, [props.data?.id, isInWishlist, isInCart]);
    
    // Handle adding/removing from wishlist
    const handleWishlistToggle = async () => {
        if (!props.data) return;
        
        try {
            if (inWishlist) {
                await removeFromWishlist(props.data.id);
            } else {
                await addToWishlist(props.data);
            }
            setInWishlist(!inWishlist);
        } catch (error) {
            // Error is handled by the context
        }
    };
    
    // Handle adding/removing from cart
    const handleCartToggle = async () => {
        if (!props.data) return;
        
        try {
            if (inCart) {
                await removeFromCart(props.data.id);
            } else {
                await addToCart(props.data);
            }
            setInCart(!inCart);
        } catch (error) {
            // Error is handled by the context
        }
    };
    
    // Render product card
    if (props.type === "products" || props.type === "related-products" || props.type === "category-products") {
        return (
            <article className="card" aria-label={props.data.title}>
                <Link 
                    className='no-underline-links' 
                    to={`/product/${props.data.title}/${props.data.id}`}
                >
                    <img src={props.data.thumbnail} alt={props.data.title} />
                </Link>
                <div className="card-info">
                    <h4>{props.data.title}</h4>
                    <hr className="divider" id='card-divider'></hr>
                    <p className="product-price">{props.data.price}</p>
                    <span>
                        <p className="product-category">
                            <Link to={`/category/${props.data.category}/${props.data.category_id || ''}`}>
                                {props.data.category}
                            </Link>
                        </p>
                    </span>
                    <div className="btn-container-card">
                        <button 
                            className="WishList" 
                            type='button' 
                            onClick={handleWishlistToggle}
                            disabled={wishlistLoading}
                            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                        >
                            <FontAwesomeIcon 
                                icon={inWishlist ? faHeartCircleMinus : faHeartCirclePlus} 
                                size='2x' 
                                className='wishListIcon'
                            />
                        </button>
                        
                        <button 
                            className="Add-cart" 
                            type='button' 
                            onClick={handleCartToggle}
                            disabled={cartLoading}
                            aria-label={inCart ? "Remove from cart" : "Add to cart"}
                        >
                            <FontAwesomeIcon 
                                icon={inCart ? faCartArrowDown : faCartPlus} 
                                size='2x' 
                                className='cartIcon'
                            />
                        </button>
                    </div>
                </div>
            </article>
        );
    } 
    // Render vendor card
    else if (props.type === "vendor") {
        return (
            <article className="card" aria-label={props.data.User || "Vendor"}>
                <div className="card-info">
                    <h4>{props.data.User}</h4>
                    <p>Vendor Review</p>
                </div>
            </article>
        );
    }
    // Render category card
    else {
        return (
            <article className="card" aria-label={props.data.title || "Category"}>
                <img src={props.data.image} alt={props.data.title} />
                <div className="card-info">
                    <Link to={`/category/${props.data.title}/${props.data.id}`}>
                        <h4>{props.data.title}</h4>
                    </Link>
                    <p>No. Of Products</p>
                </div>
            </article>
        );
    }
};

export default PcxCard;