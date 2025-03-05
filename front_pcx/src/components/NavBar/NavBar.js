/**
 * NavBar.js
 * Main navigation component for the application
 */
import './NavBar.css';
import { useState, useCallback, useEffect, useRef } from 'react';
import { MenuData } from "./MenuData";
import { Link } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import LogoImage from '../../assets/images/logox.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMagnifyingGlass, 
  faBars, 
  faTimes, 
  faComputer, 
  faUserPlus, 
  faSignInAlt, 
  faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';

/**
 * NavBar Component
 * Provides navigation and user account access
 */
export default function NavBar() {
  const { isAuthenticated, userType, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  // Toggle mobile menu
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prevState => !prevState);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu when ESC key is pressed
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isMenuOpen]);

  // Handle search form submission
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // Implement search functionality here
    if (searchQuery.trim()) {
      // Navigate to search results page or filter current page
      // For now, we'll just log the search query
    }
  }, [searchQuery]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // No need for alert, the auth context will handle redirects
    } catch (error) {
      // Handle logout error silently
    }
  }, [logout]);

  // Handle dropdown menu
  const handleDropdownOpen = useCallback(() => {
    setIsDropdownOpen(true);
  }, []);
  
  const handleDropdownClose = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  return (
    <nav className="NavBarItems" role="navigation" aria-label="Main Navigation">
      <h1 className="logo">
        <Link to="/">
          <img src={LogoImage} alt="XcelleratePCX Logo" />
        </Link>
      </h1>
      
      <div className="menuIcon">
        <button 
          onClick={toggleMenu} 
          aria-expanded={!isMenuOpen}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
        </button>
      </div>
      
      <ul ref={menuRef} className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
        <div className="Search-cont">
          <form className='SearchBar' onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search" 
              name="search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
            <button 
              className="search-btn" 
              type="submit"
              aria-label="Search"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{color: "#EF8354"}} />
            </button>
          </form>
        </div>
        
        {MenuData.map((item, index) => (
          <li key={index}>
            {index === 2 ? (
              // Account dropdown menu
              <div
                onMouseEnter={handleDropdownOpen}
                onMouseLeave={handleDropdownClose}
                className="dropdown-container"
              >
                <Link to={item.url} className="dropdown-button">
                  <FontAwesomeIcon icon={item.icon} style={{ color: "#143d85" }} />
                  {item.title}
                </Link>
                
                {isDropdownOpen && (
                  <div className="dropdown-content">
                    <ul className="dropdown">
                      {isAuthenticated ? (
                        // Show authenticated user options
                        <>
                          {userType === 'vendor' && (
                            <li>
                              <Link to="/vendor/dashboard">
                                <FontAwesomeIcon icon={faComputer} style={{ color: "#143d85" }} />
                                Vendor Dashboard
                              </Link>
                            </li>
                          )}
                          
                          {userType === 'customer' && (
                            <li>
                              <Link to="/customer/dashboard">
                                <FontAwesomeIcon icon={faComputer} style={{ color: "#143d85" }} />
                                Customer Dashboard
                              </Link>
                            </li>
                          )}
                          
                          <li>
                            <button className='logout-btn' onClick={handleLogout}>
                              <FontAwesomeIcon icon={faSignOutAlt} style={{ color: "#143d85" }} />
                              Log Out
                            </button>
                          </li>
                        </>
                      ) : (
                        // Show non-authenticated options
                        <>
                          <li>
                            <Link to="/register">
                              <FontAwesomeIcon icon={faUserPlus} style={{ color: "#143d85" }} />
                              Sign Up
                            </Link>
                          </li>
                          <li>
                            <Link to="/login">
                              <FontAwesomeIcon icon={faSignInAlt} style={{ color: "#143d85" }} />
                              Log In
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              // Regular menu items
              <Link to={item.url} className={item.className}>
                <FontAwesomeIcon icon={item.icon} style={{ color: "#143d85" }} />
                {item.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
      
      {/* Mobile menu close button - always accessible */}
      {isMenuOpen && (
        <div className="mobile-menu-close" onClick={toggleMenu} aria-label="Close menu">
          <FontAwesomeIcon icon={faTimes} />
        </div>
      )}
    </nav>
  );
}
