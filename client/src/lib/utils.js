import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

// Default avatar image path
const DEFAULT_AVATAR = '/default-avatar.svg'

/**
 * Gets user profile image URL with fallback
 * @param {Object} user - Firebase auth user object
 * @param {Object} userProfile - Additional user profile data
 * @returns {string} - URL to profile image
 */
export function getUserProfileImage(user, userProfile) {
  // Check if we should use default image directly to avoid errors
  // Google auth images can sometimes fail to load in development
  const isGoogleAuthImage = user?.photoURL?.includes('googleusercontent.com');
  
  // Check sources in order of preference
  const profileImage = 
    userProfile?.profileImageUrl || 
    (!isGoogleAuthImage ? user?.photoURL : null) || 
    DEFAULT_AVATAR;
  
  // Remove logging that's causing console spam
  // console.log("Profile image selection:", {
  //   userProfileImage: userProfile?.profileImageUrl,
  //   userPhotoURL: user?.photoURL,
  //   fallbackImage: DEFAULT_AVATAR,
  //   selectedImage: profileImage
  // });
  
  return profileImage;
}