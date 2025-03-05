// CustomerSidebar.js
import './SideBar.css'
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../Contexts/AuthContext';
import { useToggleContext } from '../../../Contexts/ToggleContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';

const SideBar = ({ MenuData }) => {
    const { isToggled, toggle } = useToggleContext();
    const { authState, logout } = useAuth();
    const location = useLocation();
    
    // Check if the current path matches the menu item path
    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className={`sidebar ${isToggled ? '' : 'collapsed'}`}>
            <div className="sidebar-header">
                <h3 className="sidebar-title">Menu</h3>
                <button 
                    className="toggle-btn" 
                    onClick={toggle} 
                    aria-label={isToggled ? "Collapse sidebar" : "Expand sidebar"}
                >
                    <FontAwesomeIcon icon={isToggled ? faXmark : faBars} />
                </button>
            </div>
            
            <ul className="sidebar-menu">
                {MenuData.map((item, index) => (
                    <li key={index} className="menu-item">
                        <Link 
                            to={item.path} 
                            className={`menu-link ${isActive(item.path) ? 'active' : ''}`}
                            aria-label={item.title}
                        >
                            <span className="menu-icon">
                                <FontAwesomeIcon icon={item.icon} />
                            </span>
                            <span className="menu-text">{item.title}</span>
                        </Link>
                    </li>
                ))}
                
                <li className="menu-item">
                    <button 
                        onClick={logout} 
                        className="menu-link"
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-label="Logout"
                    >
                        <span className="menu-icon">
                            <FontAwesomeIcon icon={MenuData[MenuData.length - 1].icon} />
                        </span>
                        <span className="menu-text">Logout</span>
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default SideBar;
