// LoadingIndicator.tsx
import React from "react";

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-6">
      <svg
        className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"
        viewBox="0 0 24 24"
      />
      <span className="ml-3 text-gray-700 text-lg">Loading...</span>
    </div>
  );
};

export default LoadingIndicator;
