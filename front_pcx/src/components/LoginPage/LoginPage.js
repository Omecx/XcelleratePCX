/**
 * LoginPage.js
 * Handles user authentication
 */
import './LoginPage.css'
import logoImage from './../../assets/images/logox.svg'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../Contexts/AuthContext';

/**
 * LoginPage Component
 * Provides a form for user authentication
 */
const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);

    /**
     * Handle form submission
     * @param {Event} event - Form submission event
     */
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Validate form data
        if (!formData.username || !formData.password) {
            setError('Please provide both username and password.');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Call login function from auth context
            const result = await login(formData);
            
            if (result.success) {
                // Redirect to the page user was trying to access or home
                navigate(from, { replace: true });
            } else {
                setError(result.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle input field changes
     * @param {Event} event - Input change event
     */
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    /**
     * Handle remember me checkbox change
     * @param {Event} event - Checkbox change event
     */
    const handleRememberMeChange = (event) => {
        setRememberMe(event.target.checked);
    };

    return (
        <div className="login-form-cont">  
            <Link to="/">
                <img src={logoImage} alt="XcelleratePCX Logo" />
            </Link>
            <form className="login-form" onSubmit={handleSubmit}>
                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}
                
                <div className="lg-credentials">
                    <h2>Login</h2>
                    
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input 
                            id="username" 
                            name="username" 
                            type="text" 
                            value={formData.username}
                            onChange={handleChange}
                            disabled={loading}
                            aria-required="true"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            id="password" 
                            name="password" 
                            type="password" 
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            aria-required="true"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        aria-busy={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                    
                    <div className="form-options">
                        <div className="remember-me">
                            <input 
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={handleRememberMeChange}
                                disabled={loading}
                            />
                            <label htmlFor="rememberMe">Remember Me</label>
                        </div>
                        <div className="forgot-password">
                            <Link to="/forgot-password">Forgot Password?</Link>
                        </div>
                    </div>
                </div>
                
                <div className="register">
                    <h5>Don't Have an Account?</h5>
                    <Link to="/register" className="register-button">
                        Create new Account
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;