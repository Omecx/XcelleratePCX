/**
 * CategoryGrid.js
 * Displays categories in a grid layout with statistics
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CategoryGrid.css';
import { useApiData } from '../../Contexts/ApiDataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faChartBar, faSpinner } from '@fortawesome/free-solid-svg-icons';

const CategoryGrid = () => {
    const [categories, setCategories] = useState([]);
    const { fetchCategoriesWithStats, loading, error } = useApiData();
    
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await fetchCategoriesWithStats();
                if (Array.isArray(data)) {
                    setCategories(data);
                }
            } catch (err) {
                console.error('Error loading categories with stats:', err);
            }
        };
        
        loadCategories();
    }, [fetchCategoriesWithStats]);
    
    if (loading) {
        return (
            <div className="category-grid-loading">
                <FontAwesomeIcon icon={faSpinner} spin /> 
                <span>Loading categories...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="category-grid-error">
                <p>Error loading categories: {error}</p>
            </div>
        );
    }
    
    if (!categories.length) {
        return (
            <div className="category-grid-empty">
                <p>No categories found. Check back later!</p>
            </div>
        );
    }
    
    return (
        <div className="category-grid">
            {categories.map(category => (
                <Link 
                    to={`/category/${category.title}/${category.id}`} 
                    className="category-card" 
                    key={category.id}
                >
                    <div className="category-image">
                        {category.image ? (
                            <img src={category.image} alt={category.title} />
                        ) : (
                            <FontAwesomeIcon icon={faBoxOpen} className="placeholder-icon" />
                        )}
                    </div>
                    
                    <div className="category-info">
                        <h3 className="category-title">{category.title}</h3>
                        <p className="category-detail">{category.detail}</p>
                        
                        <div className="category-stats">
                            <div className="stat">
                                <FontAwesomeIcon icon={faBoxOpen} />
                                <span>{category.product_count} Products</span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default CategoryGrid; 