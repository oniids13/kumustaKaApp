import React, { useState } from "react";

const SparkButton = () => {
  const [isSparked, setIsSparked] = useState(false);

  const handleSpark = () => {
    setIsSparked(!isSparked);
  };

  return (
    <div
      onClick={handleSpark}
      style={{ cursor: "pointer", width: "48px", height: "48px" }}
    >
      <svg
        width="38"
        height="38"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isSparked ? "active" : ""}
      >
        <path
          d="M32 2C20 2 12 10 12 20C12 30 20 38 32 38C44 38 52 30 52 20C52 10 44 2 32 2Z"
          fill="#FFC107"
          stroke="#FFA000"
          strokeWidth="2"
        />
        <path
          d="M20 24C20 18 24 14 30 14C36 14 40 18 40 24C40 30 36 34 30 34C24 34 20 30 20 24Z"
          fill="#FFEB3B"
          stroke="#FBC02D"
          strokeWidth="2"
        />
        <g style={{ opacity: isSparked ? 1 : 0 }}>
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
      </svg>

      <style jsx>{`
        svg {
          transition: transform 0.2s ease;
        }
        svg:hover {
          transform: scale(1.05);
        }
        .active {
          animation: sparkAnimation 0.5s ease-out;
        }
        @keyframes sparkAnimation {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default SparkButton;
