import  './AllProductsPage.css';
import CardList  from './../CardList/CardList'

const AllProductsPage = () => {
    return (
        <>
        <div className="products-cont">
            <div className="product-top">
                {/* <h3>All Categories</h3> */}
                <hr className="divider"></hr>
            </div>
            <div className="product-main">
                <CardList type="products" heading="All Products" showPagination={true} nItems={3}/>
            </div>
        </div>
        </>
    );
};

export default AllProductsPage;