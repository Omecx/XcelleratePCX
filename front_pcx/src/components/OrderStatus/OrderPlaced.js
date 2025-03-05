import './OrderStatus.css'
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const OrderPlaced = () => {
    return (
        <div className="order-status-cont">
            <div className="card">
                <h1>Order Placed</h1>
                <FontAwesomeIcon icon={faCheckCircle} id='placed'/>
                <h5>Time: </h5>
            </div>
            <div className="btn-cont">
                <button>Continue Shopping</button>
                <button>See Orders</button>
            </div>
        </div>
    );
};

export default OrderPlaced;