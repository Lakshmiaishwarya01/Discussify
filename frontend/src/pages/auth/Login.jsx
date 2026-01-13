import React, { useState, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [errors, setErrors] = useState({
        email: "",
        password: ""
    });

    const [valid, setValid] = useState({
        email: false,
        password: false,
        isButtonActive: false
    });

    const handleChange = (e) => {
        const fieldName = e.target.name;
        // Force lowercase for email
        const fieldValue = fieldName === 'email' ? e.target.value.toLowerCase() : e.target.value;
        
        setFormData({
            ...formData,
            [fieldName]: fieldValue
        });
        validateField(fieldName, fieldValue);
    };

    const validateField = (fieldName, fieldValue) => {
        var newError = { ...errors };
        var newValid = { ...valid };

        switch (fieldName) {
            case "email":
                const regex = /^[a-z][a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
                if (fieldValue === "") {
                    newError.email = "Field is Required";
                    newValid.email = false;
                } else if (!regex.test(fieldValue)) {
                    newError.email = "Invalid email address";
                    newValid.email = false;
                } else {
                    newError.email = "";
                    newValid.email = true;
                }
                break;
            case "password":
                if (fieldValue === "") {
                    newError.password = "Field is Required";
                    newValid.password = false;
                } else {
                    newError.password = "";
                    newValid.password = true;
                }
                break;
            default:
                break;
        }
        newValid.isButtonActive = newValid.email && newValid.password;
        setErrors(newError);
        setValid(newValid);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!valid.isButtonActive) return;

        try {
            // Keep your existing endpoint
            const res = await API.post('/users/login', formData);
            
            const { token, user } = res.data; 

            login(user, token);

            toast.success("Login Successful! Welcome back.");

            setTimeout(() => {
                navigate('/home');
            }, 1000);

        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Login failed. Please try again.";
            toast.error(msg);
        }
    };

    return (
        <div className="auth-page">
            {/* Ambient Background Orbs */}
            <div className="auth-orb orb-1"></div>
            <div className="auth-orb orb-2"></div>

            <div className="auth-card">
                <div className="auth-header text-center mb-4">
                    <h2>Welcome Back</h2>
                    <p>Enter your credentials to access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {/* Email Input */}
                    <div className="mb-3">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <div className="glass-input-group">
                            <i className="bi bi-envelope"></i>
                            <input 
                                className="glass-input" 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                id="email" 
                                placeholder="name@example.com" 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        {errors.email && <div className='text-danger small mt-1 ms-2'>{errors.email}</div>}
                    </div>

                    {/* Password Input */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label mb-0" htmlFor="password">Password</label>
                            <Link to="/forgot-password" style={{fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'none'}}>
                                Forgot?
                            </Link>
                        </div>
                        <div className="glass-input-group">
                            <i className="bi bi-lock"></i>
                            <input 
                                className="glass-input" 
                                type="password" 
                                name="password" 
                                value={formData.password} 
                                id="password" 
                                placeholder="••••••••" 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        {errors.password && <div className='text-danger small mt-1 ms-2'>{errors.password}</div>}
                    </div>

                    <button 
                        className='btn-auth-submit' 
                        type='submit'
                        disabled={!valid.isButtonActive}
                    >
                        Log In
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;