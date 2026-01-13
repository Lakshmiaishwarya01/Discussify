import React, { useState, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/login.css';

const Registration = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        passwordConfirm: ""
    });

    const [errors, setErrors] = useState({
        username: "",
        email: "",
        password: "",
        passwordConfirm: ""
    });

    const [valid, setValid] = useState({
        username: false,
        email: false,
        password: false,
        passwordConfirm: false,
        isButtonActive: false
    });

    const handleChange = (e) => {
        const fieldName = e.target.name;
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
            case "username":
                const nameregex = /^[A-Za-z0-9_]+$/;
                if (fieldValue === "") {
                    newError.username = "Field is Required";
                    newValid.username = false;
                }
                else if (fieldValue.length < 4) {
                    newError.username = "Username must contain at least 4 characters"
                    newValid.username = false;
                }
                else if (fieldValue.length > 20) {
                    newError.username = "Username must not exceed 20 characters"
                    newValid.username = false;
                }
                else if (!nameregex.test(fieldValue)) {
                    newError.username = "Username must contain letters, numbers, or underscores only"
                    newValid.username = false;
                }
                else {
                    newError.username = "";
                    newValid.username = true;
                }
                break;
            case "email":
                const regex = /^[a-z][a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
                if (fieldValue === "") {
                    newError.email = "Field is Required";
                    newValid.email = false;
                } else if (!regex.test(fieldValue)) {
                    newError.email = "Invalid email format"
                    newValid.email = false;
                }
                else {
                    newError.email = "";
                    newValid.email = true;
                }
                break;
            case "password":
                const regex1 = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,20}$/;
                if (fieldValue === "") {
                    newError.password = "Field is Required";
                    newValid.password = false;
                }
                else if (fieldValue.length < 8) {
                    newError.password = "Password should contain minimum of 8 characters";
                    newValid.password = false;
                }
                else if (!regex1.test(fieldValue)) {
                    newError.password = "Password must contain at least one uppercase, lowercase, digit, and special character.";
                    newValid.password = false;
                }
                else {
                    newError.password = "";
                    newValid.password = true;

                    if (formData.passwordConfirm) {
                        if (fieldValue !== formData.passwordConfirm) {
                            newError.passwordConfirm = "Passwords do not match";
                            newValid.passwordConfirm = false;
                        } else {
                            newError.passwordConfirm = "";
                            newValid.passwordConfirm = true;
                        }
                    }
                }
                break;
            case 'passwordConfirm':
                if (fieldValue !== formData.password) {
                    newError.passwordConfirm = "Passwords do not match";
                    newValid.passwordConfirm = false;
                }
                else {
                    newError.passwordConfirm = "";
                    newValid.passwordConfirm = true;
                }
                break;
            default:
                break;
        }

        newValid.isButtonActive = newValid.username && newValid.email && newValid.password && newValid.passwordConfirm;
        
        setErrors(newError);
        setValid(newValid);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!valid.isButtonActive) return;

        try {
            const res = await API.post('/users/signup', formData);

            const token = res.data.token;
            const user = res.data.newUser;

            login(user, token);

            toast.success("Registration Successful! Welcome to Discussify.");

            setTimeout(() => {
                navigate('/home'); 
            }, 1000);

        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Registration failed. Please try again.";
            toast.error(msg);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-orb orb-1"></div>
            <div className="auth-orb orb-2"></div>

            <div className="auth-card">
                <div className="auth-header text-center mb-4">
                    <h2>Create Account</h2>
                    <p>Join the community and start discussing</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {/* Username Input */}
                    <div className="mb-3">
                        <label className="form-label" htmlFor="username">Username</label>
                        <div className="glass-input-group">
                            <i className="bi bi-person"></i>
                            <input 
                                className='glass-input' 
                                type="text" 
                                name="username" 
                                value={formData.username} 
                                id='username' 
                                placeholder='johndoe' 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        {errors.username && <div className='text-danger small mt-1 ms-2'>{errors.username}</div>}
                    </div>

                    {/* Email Input */}
                    <div className="mb-3">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <div className="glass-input-group">
                            <i className="bi bi-envelope"></i>
                            <input 
                                className='glass-input' 
                                type="email" 
                                name='email' 
                                value={formData.email} 
                                id='email' 
                                placeholder='name@example.com' 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        {errors.email && <div className='text-danger small mt-1 ms-2'>{errors.email}</div>}
                    </div>

                    {/* Password Input */}
                    <div className="mb-3">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div className="glass-input-group">
                            <i className="bi bi-lock"></i>
                            <input 
                                className='glass-input' 
                                type="password" 
                                name='password' 
                                value={formData.password} 
                                id='password' 
                                placeholder='••••••••' 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        {errors.password && <div className='text-danger small mt-1 ms-2'>{errors.password}</div>}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="mb-4">
                        <label className="form-label" htmlFor="passwordConfirm">Confirm Password</label>
                        <div className="glass-input-group">
                            <i className="bi bi-check2-circle"></i>
                            <input 
                                className='glass-input' 
                                type="password" 
                                name='passwordConfirm' 
                                value={formData.passwordConfirm} 
                                id='passwordConfirm' 
                                placeholder='••••••••' 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        {errors.passwordConfirm && <div className='text-danger small mt-1 ms-2'>{errors.passwordConfirm}</div>}
                    </div>

                    <button 
                        className='btn-auth-submit' 
                        type='submit'
                        disabled={!valid.isButtonActive}
                    >
                        Sign Up
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login" className="auth-link">Log In</Link>
                </div>
            </div>
        </div>
    );
};

export default Registration;