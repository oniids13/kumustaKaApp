import React, { useState } from "react";
import "../styles/SparkButton.css";

const SparkButton = ({
  initialCount = 0,
  isSparked = false,
  onSpark,
  disabled = false,
}) => {
  const [showBoost, setShowBoost] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      if (!isSparked) {
        setShowBoost(true);
        setTimeout(() => setShowBoost(false), 1000);
      }
      onSpark();
    }
  };

  return (
    <div className="spark-container">
      <button
        className={`spark-button ${isSparked ? "active" : ""} ${
          disabled ? "disabled" : ""
        }`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={isSparked ? "Remove spark" : "Add spark"}
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M32 2C20 2 12 10 12 20C12 30 20 38 32 38C44 38 52 30 52 20C52 10 44 2 32 2Z"
            fill={isSparked ? "#FFD700" : "#FFC107"}
            stroke="#FFA000"
            strokeWidth="2"
          />
          <path
            d="M20 24C20 18 24 14 30 14C36 14 40 18 40 24C40 30 36 34 30 34C24 34 20 30 20 24Z"
            fill={isSparked ? "#FFF59D" : "#FFEB3B"}
            stroke="#FBC02D"
            strokeWidth="2"
          />
          {isSparked && (
            <g>
              <line
                x1="32"
                y1="0"
                x2="32"
                y2="8"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <line
                x1="0"
                y1="32"
                x2="8"
                y2="32"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <line
                x1="56"
                y1="32"
                x2="64"
                y2="32"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <line
                x1="32"
                y1="56"
                x2="32"
                y2="64"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <line
                x1="12"
                y1="12"
                x2="18"
                y2="18"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <line
                x1="46"
                y1="46"
                x2="52"
                y2="52"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <line
                x1="46"
                y1="18"
                x2="52"
                y2="12"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <line
                x1="12"
                y1="52"
                x2="18"
                y2="46"
                stroke="#FFD700"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
        {showBoost && <div className="boost-text">+1</div>}
      </button>

      <div className="spark-count">
        <span className="count">{initialCount}</span>
        <span className="label">
          {isSparked ? "You sparked this 🌟" : "Sparks"}
        </span>
      </div>
    </div>
  );
};

export default SparkButton;
