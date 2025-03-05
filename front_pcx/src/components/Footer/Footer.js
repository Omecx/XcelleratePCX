import './Footer.css'
import { Link } from "react-router-dom";
import { sections } from "./../Footer/FooterData.js";
import { useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <>
        <div className="sign-in-box">
            <hr className="divider"></hr>
            <p>Enable Curated Choices</p>
            <button><Link to='/login'>Sign in</Link></button>
            <p>New Customer? <Link to='/register' className='no-underline-links'>Start here.</Link></p>
            <hr className="divider"></hr>
        </div>
        <div className="footer-cont">
            <button onClick={null} className='back-top'>Back to top</button>
            <div className="footer-main">
                {sections.map((section, idx) => (
                    <div className={`footer-section block${idx}`}>
                        <h4>{section.title}</h4>
                        {section.content && <p><Link to={section.url}>{section.content}</Link></p>}
                        {section.items && (
                            <ul>
                                {section.items.map((item, itemIdx) => (
                                    <li key={`footer-item-${itemIdx}`}>
                                        <Link to={item.url}>{item.text}</Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
            <div className="footer-bottom">
                <p>&copy; 2023 XcelleratePCX. All rights reserved.</p>
            </div>
        </div>
        </>
    );
};

export default Footer;