import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function NotFound() {
    return (
        <div 
            className="d-flex flex-column align-items-center justify-content-center text-center py-5"
            style={{ 
                backgroundColor: '#1f2025', 
                minHeight: '100vh',
                color: 'white'
            }}
        >
            <h1 
                className="display-1 fw-bold mb-4"
                style={{
                    background: 'linear-gradient(to right, white, #6c757d)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}
            >
                404 Not Found
            </h1>
            
            <div 
                className="my-4"
                style={{
                    height: '1px',
                    width: '320px',
                    background: 'linear-gradient(to right, #6c757d, #343a40)',
                    borderRadius: '50px'
                }}
            ></div>
            
            <p className="fs-5 text-muted mb-5" style={{ maxWidth: '500px' }}>
                The page you are looking for does not exist or has been moved.
            </p>
            
            <Link 
                to="/" 
                className="btn btn-light btn-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                style={{ 
                    color: '#1f2025',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
                Back to Home
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.583 11h12.833m0 0L11 4.584M17.416 11 11 17.417" stroke="#1E1E1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </Link>
        </div>
    );
}