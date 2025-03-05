import "./RegisterPage.css";
import axios from "axios";
import { useEffect, useState } from "react";
import LogoImage from './../../assets/images/logox.svg';
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../Contexts/config";
import { authAPI } from "../../services/api";

const RegisterPage = () => {
    const [isRegistered, setIsRegistered] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isRegistered) {
            navigate('/login');
        }
    }, [isRegistered, navigate]);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        registration_type: 'customer', // Default to customer
        firstname: '',
        lastname: '',
        contact: '',
    });

    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        
        if (!formData.username) errors.username = 'Username is required';
        if (!formData.email) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
        if (!formData.password) errors.password = 'Password is required';
        else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (!formData.firstname) errors.firstname = 'First name is required';
        if (!formData.lastname) errors.lastname = 'Last name is required';
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear validation error when field is edited
        if (validationErrors[name]) {
            setValidationErrors({
                ...validationErrors,
                [name]: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await authAPI.register(formData);
            console.log('Registration Successful:', response.data);
            setIsRegistered(true);
        } catch (error) {
            console.error('Registration Failed:', error);
            setError(error.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="register-form-cont">
                <Link to="/"><img src={LogoImage} alt="logo" /></Link>
                
                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="register-form-fields">
                        {error && <p className="error-message">{error}</p>}
                        
                        <h2>Create Account</h2><br />
                        
                        <label htmlFor="firstname">First Name</label>
                        <input 
                            type="text" 
                            id="firstname" 
                            name="firstname" 
                            value={formData.firstname}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {validationErrors.firstname && <p className="field-error">{validationErrors.firstname}</p>}
                        
                        <label htmlFor="lastname">Last Name</label>
                        <input 
                            type="text" 
                            id="lastname" 
                            name="lastname" 
                            value={formData.lastname}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {validationErrors.lastname && <p className="field-error">{validationErrors.lastname}</p>}
                        
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {validationErrors.email && <p className="field-error">{validationErrors.email}</p>}
                        
                        <label htmlFor="username">Username</label>
                        <input 
                            type="text" 
                            id="username" 
                            name="username" 
                            value={formData.username}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {validationErrors.username && <p className="field-error">{validationErrors.username}</p>}
                        
                        <label htmlFor="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        {validationErrors.password && <p className="field-error">{validationErrors.password}</p>}
                        
                        <label htmlFor="registration_type">Registration Type</label>
                        <select 
                            id="registration_type" 
                            name="registration_type" 
                            value={formData.registration_type}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                        </select>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                        
                        <div className="login-link">
                            <p>Already have an account? <Link to="/login">Login</Link></p>
                        </div>
                    </div>     
                </form>
            </div>
            <footer>
                <h4>This is the Footer</h4>
            </footer>
        </>
    );
};

export default RegisterPage;