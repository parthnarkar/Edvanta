import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition Component
 * 
 * A wrapper component that provides smooth transitions between pages
 * Uses CSS animations defined in index.css
 */
export function PageTransition({ children }) {
  const location = useLocation();
  
  return (
    <div 
      key={location.pathname}
      className="animate-fadeIn w-full"
      style={{ 
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {children}
    </div>
  );
}

// Add this to index.css if not already present
// @keyframes fadeIn {
//   from {
//     opacity: 0;
//     transform: translateY(8px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }