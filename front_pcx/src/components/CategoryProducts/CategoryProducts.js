import  './CategoryProducts.css';
import CardList  from './../CardList/CardList';
import { useParams } from 'react-router-dom';

const CategoryProducts = (props) => {

    const { category_slug ,category_id } = useParams();

    console.log(category_id)

    return (
        <>
        <div className="category-cont">
            <div className="category-top">
                {/* <h3>All Categories</h3> */}
                <hr className="divider"></hr>
            </div>
            <div className="category-main">
            <CardList type="category-products" heading={`Products: ${category_slug}`} category_id={category_id} category_slug={category_slug} showPagination={true} nItems={3}/>
            </div>
        </div>
        </>
    );
};

export default CategoryProducts;
