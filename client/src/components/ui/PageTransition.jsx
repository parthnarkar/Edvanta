import React from 'react';
import { useLocation } from 'react-router-dom';
import './custom-css/PageTransition.css';

/**
 * PageTransition Component
 * 
 * A wrapper component that provides smooth transitions between pages
 * Uses CSS animations defined in PageTransition.css
 */
export function PageTransition({ children }) {
  const location = useLocation();
  
  return (
    <div 
      key={location.pathname}
      className="w-full"
      style={{ 
        animation: 'fadeIn 0.3s ease-out',
        opacity: 1
      }}
    >
      {children}
    </div>
  );
}