import React from 'react';
import './LoadingIndicator.css';

/**
 * LoadingIndicator Component
 * 
 * A beautifully designed loading indicator with modern animations
 * and enhanced visual appeal for a premium application experience
 */
export function LoadingIndicator({ 
  size = "default", 
  message = "Loading...",
  showMessage = true,
  className = ""
}) {
  const sizeClasses = {
    small: "h-12 w-12",
    default: "h-20 w-20",
    large: "h-24 w-24"
  };

  const messageClasses = {
    small: "text-xs mt-3",
    default: "text-sm mt-4",
    large: "text-base mt-5"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Logo with enhanced animation */}
      <div className="relative mb-6">
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl transform scale-110 animate-glow"></div>
        
        {/* Rotating ring around logo */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/70 border-r-primary/40 animate-spin"></div>
        
        {/* Logo with floating animation */}
        <img 
          src="/edvanta-logo.png" 
          alt="Edvanta Logo" 
          className={`${sizeClasses[size]} relative z-10 mx-auto animate-float`}
        />
      </div>
      
      {/* Message with gradient text */}
      {showMessage && (
        <p className={`font-medium bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent animate-fadeIn ${messageClasses[size]}`}>
          {message}
        </p>
      )}
      
      {/* Enhanced loading dots with better animation */}
      <div className="mt-4 flex justify-center space-x-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <span 
            key={index}
            className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-blue-500 shadow-lg shadow-primary/30 animate-pulse-and-float"
            style={{ animationDelay: `${index * 150}ms` }}
          ></span>
        ))}
      </div>
      
      {/* Animated progress bar */}
      <div className="mt-6 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary via-blue-500 to-primary rounded-full animate-progress-bar"
          style={{ backgroundSize: '200% 100%' }}
        ></div>
      </div>
    </div>
  );
}