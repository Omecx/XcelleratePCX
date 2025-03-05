import './CarousalPcx.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import CardList from '../CardList/CardList';


const Carousal = (props) => {

    const [slide, setSlide] = useState(0);

    const nextSlide = () => {
        console.log("clicked left")
        setSlide((slide + 1) % props.data.length);
    }

    const prevSlide = () => {
        console.log("clicked right")
        setSlide((slide - 1 + props.data.length) % props.data.length);
    }

    return (
        <div className="carousal-cont">
            <div className="carousal">
                <button className="left" onClick={prevSlide}>
                    <FontAwesomeIcon icon={faChevronLeft} /> 
                </button>
                {props.data.map((item, idx) => {
                    if (props.type === 'offers') {
                        return (
                            <img src={item.src} alt={item.alt} key={idx} className={slide === idx ? 'offer-img' : 'offer-img offer-img-hidden'}></img>
                        );
                    } else if (props.type === 'reviews') {
                        return (
                          <div key={idx} className={slide === idx ? 'review' : 'review review-hidden'}>
                            <h3>{item.author}</h3>
                            <p>{item.review}</p>
                          </div>
                        );
                      } else if (props.type === 'related-products') {
                        return (
                          <div key={idx} className={slide === idx ? 'related-pds' : 'related-pds related-pds-hidden'}>
                            {/* <p>{item.author}</p> */}
                            <CardList id="rel-pds" type='related-products' showPagination={true} nItems={3}/>
                          </div>
                        );
                      }
                      return null;
                })}
                <button className="right" onClick={nextSlide}>
                    <FontAwesomeIcon icon={faChevronRight} />          
                </button>
            </div>
        </div>
    );
};
export default Carousal;



