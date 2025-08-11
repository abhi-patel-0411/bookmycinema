import React from "react";

const BrandLogo = ({ className = "" }) => {
  return (
    <>
      <style>
        {`
          .brand-logo-professional {
            font-family: 'Poppins', 'Segoe UI', sans-serif;
            font-size: 1.5rem;
            font-weight: 600;
            color: #ffffff;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 2px;
            letter-spacing: -0.5px;
          }
          
          .brand-logo-animated {
            animation: logoEntrance 2s ease-out;
          }
          
          .brand-text-book {
            animation: slideInLeft 1.5s ease-out;
          }
          
          .brand-text-cinema {
            animation: slideInRight 1.5s ease-out 0.3s both;
          }
          
          .brand-my-box {
            margin: 0 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            padding: 4px;
            transition: all 0.3s ease;
            animation: logoSpin 2s ease-out 0.5s both;
          }
          
          .brand-my-box:hover {
            background: rgba(229, 9, 20, 0.2);
            transform: scale(1.05);
          }
          
          @keyframes logoEntrance {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.1);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes slideInLeft {
            0% {
              opacity: 0;
              transform: translateX(-30px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideInRight {
            0% {
              opacity: 0;
              transform: translateX(30px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes logoSpin {
            0% {
              opacity: 0;
              transform: rotate(-180deg) scale(0);
            }
            70% {
              opacity: 0.8;
              transform: rotate(10deg) scale(1.1);
            }
            100% {
              opacity: 1;
              transform: rotate(0deg) scale(1);
            }
          }
          
          @media (max-width: 768px) {
            .brand-logo-professional {
              font-size: 1.1rem;
            }
            .brand-my-box {
              font-size: 0.85rem;
              padding: 3px 6px;
            }
          }
        `}
      </style>
      <div
        className={`brand-logo-professional brand-logo-animated ${className}`}
      >
        <span
          className="brand-text-book"
          style={{
            color: className.includes("ticket-logo") ? "#e50914" : "#ffffff",
          }}
        >
          Book
        </span>
        <span className="brand-my-box">
          <img
            src="/bookmyshow.png"
            alt="BookMyShow"
            style={{
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              objectFit: "cover",
            }}
          />
        </span>
        <span
          className="brand-text-cinema"
          style={{
            color: className.includes("ticket-logo") ? "#e50914" : "#fff",
          }}
        >
          Cinema
        </span>
      </div>
    </>
  );
};

export default BrandLogo;
