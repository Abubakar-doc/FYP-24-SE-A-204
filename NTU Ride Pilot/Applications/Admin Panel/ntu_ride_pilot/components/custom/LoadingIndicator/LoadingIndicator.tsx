// LoadingIndicator.tsx
import React from "react";

interface LoadingIndicatorProps {
  fullscreen?: boolean;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullscreen = false,
  message = "Loading...",
}) => {
  return (
    <div
      className={
        fullscreen
          // Lighter and softer background overlay
          ? "fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm"
          : "flex items-center justify-center py-6"
      }
    >
      <svg
        className="animate-spin h-12 w-12"
        viewBox="0 0 50 50"
        fill="none"
      >
        <circle
          className="opacity-20"
          cx="25"
          cy="25"
          r="20"
          stroke="#3B82F6"
          strokeWidth="6"
        />
        <path
          d="M45 25c0-11.046-8.954-20-20-20"
          stroke="url(#spinner-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="spinner-gradient" x1="25" y1="5" x2="25" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
      <span className="ml-4 text-gray-800 text-lg font-medium animate-pulse select-none">
        {message}
      </span>
    </div>
  );
};

export default LoadingIndicator;
