import './Carousal.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Carousal = (props) => {
    const [slide, setSlide] = useState(0);
    const [autoplay, setAutoplay] = useState(true);

    // Autoplay functionality
    useEffect(() => {
        let interval;
        if (autoplay) {
            interval = setInterval(() => {
                setSlide((prevSlide) => (prevSlide + 1) % props.data.length);
            }, 5000); // Change slide every 5 seconds
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoplay, props.data.length]);

    // Pause autoplay when user interacts with carousel
    const pauseAutoplay = () => {
        setAutoplay(false);
        // Resume autoplay after 10 seconds of inactivity
        setTimeout(() => setAutoplay(true), 10000);
    };

    const nextSlide = () => {
        pauseAutoplay();
        setSlide((slide + 1) % props.data.length);
    }

    const prevSlide = () => {
        pauseAutoplay();
        setSlide((slide - 1 + props.data.length) % props.data.length);
    }

    // Helper function to safely create URL-friendly strings
    const createSafeUrl = (name) => {
        if (!name) return '';
        return name.toString().replace(/\s+/g, '-').toLowerCase();
    };

    return (
        <div className="carousal-cont">
            <div className="carousal">
                <button className="left" onClick={prevSlide} aria-label="Previous slide">
                    <FontAwesomeIcon icon={faChevronLeft} /> 
                </button>
                
                {props.data.map((item, idx) => {
                    const isCurrentSlide = slide === idx;
                    
                    // Safely check if this is a product slide (has id and price)
                    const isProduct = item && item.id && item.price;
                    const itemName = item && item.name ? item.name : '';
                    
                    return (
                        <div key={idx} className={isCurrentSlide ? 'slide active' : 'slide'}>
                            {isCurrentSlide && (
                                <>
                                    {isProduct ? (
                                        <Link to={`/product/${createSafeUrl(itemName)}/${item.id}`}>
                                            <img 
                                                src={item.src} 
                                                alt={item.alt || 'Product image'} 
                                                className="offer-img"
                                            />
                                            <div className="product-info">
                                                <h3>{itemName}</h3>
                                                <span className="price">${item.price}</span>
                                            </div>
                                        </Link>
                                    ) : (
                                        <img 
                                            src={item.src} 
                                            alt={item.alt || 'Carousel image'} 
                                            className="offer-img"
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
                
                <button className="right" onClick={nextSlide} aria-label="Next slide">
                    <FontAwesomeIcon icon={faChevronRight} />          
                </button>
            </div>
        </div>
    );
};

export default Carousal;