import './OrderStatus.css'
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const OrderPlaced = () => {
    return (
        <div className="order-status-cont">
            <div className="card">
                <h1>Order Failed</h1>
                <FontAwesomeIcon icon={faTimesCircle} id="failed"/>
            </div>
            <div className="btn-cont">
                <button>Continue Shopping</button>
                <button>See Orders</button>
            </div>
        </div>
    );
};

export default OrderPlaced;