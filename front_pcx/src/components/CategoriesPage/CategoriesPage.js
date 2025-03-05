import React from 'react';
import './CategoriesPage.css';
import CardList from '../CardList/CardList';
import CategoryGrid from './CategoryGrid';

/**
 * CategoriesPage Component
 * Displays all product categories
 */
const CategoriesPage = () => {
    return (
        <div className="categories-page">
            <div className="categories-header">
                <h1>Product Categories</h1>
                <p>Browse our extensive collection of products by category</p>
            </div>
            
            {/* New enhanced category grid display */}
            <div className="categories-container">
                <CategoryGrid />
            </div>
            
            {/* Legacy category listing as fallback */}
            <div className="categories-legacy" style={{ display: 'none' }}>
                <CardList type="categories" heading="All Categories" showPagination={true} nItems={6} />
            </div>
        </div>
    );
};

export default CategoriesPage;