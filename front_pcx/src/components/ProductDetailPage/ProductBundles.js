/**
 * ProductBundles.js
 * Displays products that are frequently purchased together with the current product
 */
import React, { useState, useEffect } from 'react';
import { useApiData } from '../../Contexts/ApiDataContext';
import { useCart } from '../../Contexts/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faSpinner, faPlus } from '@fortawesome/free-solid-svg-icons';
import CardList from '../CardList/CardList';
import './ProductBundles.css';

const ProductBundles = ({ productId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bundleProducts, setBundleProducts] = useState([]);
  const [bundleSavings, setBundleSavings] = useState(0);
  const { addToCart } = useCart();
  const { fetchData } = useApiData();

  useEffect(() => {
    const fetchBundleProducts = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch related products of type 'purchased_together'
        const response = await fetchData(`/related-products/?product_id=${productId}&relation_type=purchased_together`, 'GET');
        
        if (response && Array.isArray(response)) {
          // Extract the target product details from each related product
          const products = response.map(item => item.target_product_details);
          setBundleProducts(products);
          
          // Calculate bundle savings (example: 5% off total price)
          if (products.length > 0) {
            const totalPrice = products.reduce((sum, product) => sum + parseFloat(product.price || 0), 0);
            setBundleSavings(totalPrice * 0.05); // 5% discount example
          }
        } else {
          setBundleProducts([]);
        }
      } catch (err) {
        console.error('Error fetching bundle products:', err);
        setError('Failed to load bundle products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBundleProducts();
  }, [productId, fetchData]);

  // Don't render anything if no bundle products
  if (!loading && (bundleProducts.length === 0 || error)) {
    return null;
  }

  const handleAddBundle = () => {
    // Add all bundle products to cart
    bundleProducts.forEach(product => {
      addToCart(product);
    });
  };

  return (
    <section className="product-bundles">
      <h2>Frequently Purchased Together</h2>
      
      {loading ? (
        <div className="bundles-loading">
          <FontAwesomeIcon icon={faSpinner} spin /> Loading bundle recommendations...
        </div>
      ) : (
        <div className="bundle-content">
          <CardList 
            type="bundled-products"
            product_id={productId} 
            showPagination={false}
            nItems={bundleProducts.length}
          />
          
          {bundleProducts.length > 0 && (
            <div className="bundle-actions">
              <button 
                className="add-bundle-button" 
                onClick={handleAddBundle}
                aria-label="Add all items to cart"
              >
                <FontAwesomeIcon icon={faCartPlus} />
                Add All Items to Cart
              </button>
              
              {bundleSavings > 0 && (
                <span className="bundle-savings">
                  Save ${bundleSavings.toFixed(2)} when purchased together!
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ProductBundles; 