/**
 * Centralized API utility for Edvanta client
 * 
 * Provides consistent error handling, loading states and network retry logic
 * for seamless backend integration across all components.
 * Works in all environments: development, production, Vercel, Netlify, etc.
 */

import { useState, useCallback } from 'react';
import backEndURL from '../hooks/helper';
import { auth } from './firebase';

// Environment-aware API URL resolution
const getAPIBaseURL = () => {
  // In production, use the production API URL
  if (import.meta.env.PROD && import.meta.env.VITE_PRODUCTION_API_URL) {
    return import.meta.env.VITE_PRODUCTION_API_URL.replace(/\/$/, '');
  }
  
  // In development, use the development API URL
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  
  // Fallback to helper URL or localhost
  if (backEndURL) {
    return backEndURL.replace(/\/$/, '');
  }
  
  return 'http://localhost:5000';
};

// Error types for better error handling
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT'
};

// API Response wrapper
class APIResponse {
  constructor(success, data, error = null, status = null) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.status = status;
  }

  static success(data, status = 200) {
    return new APIResponse(true, data, null, status);
  }

  static error(error, status = null, type = ErrorTypes.SERVER_ERROR) {
    return new APIResponse(false, null, { message: error, type, status }, status);
  }
}

// Centralized API client
export class APIClient {
  constructor(baseURL = null) {
    // Use environment-aware URL resolution
    this.baseURL = baseURL || getAPIBaseURL();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.retryAttempts = 3;
    this.retryDelay = 1000; // ms
    
    console.log(`🌐 API Client initialized with base URL: ${this.baseURL}`);
  }

  // Enhanced fetch with retry logic and proper error handling
  async fetchWithRetry(url, options = {}, attempts = this.retryAttempts) {
    // Immediate offline check - fail fast without retry
    if (!navigator.onLine) {
      const offlineError = new Error('Device is offline');
      offlineError.name = 'OfflineError';
      throw offlineError;
    }

    try {
      const controller = new AbortController();
      const timeoutMs = options.timeout || 60000; // Allow custom timeout or default to 60s
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const requestHeaders = {
        ...this.defaultHeaders,
        ...options.headers,
      };

      // Automatically inject Firebase ID token if user is signed in
      if (!requestHeaders['Authorization'] && auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
          }
        } catch (e) {
          console.debug('Failed to get Firebase token:', e);
        }
      }

      if (options.body instanceof FormData) {
        delete requestHeaders['Content-Type'];
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: requestHeaders,
      });

      clearTimeout(timeoutId);

      return response;
    } catch (error) {
      // Don't retry if offline
      if (!navigator.onLine || error.name === 'OfflineError') {
        error.name = 'OfflineError';
        throw error;
      }

      // Retry only for specific errors and if attempts remaining
      if (attempts > 1 && (error.name === 'TypeError' || error.name === 'AbortError')) {
        console.warn(`Retrying request to ${url}. Attempts left: ${attempts - 1}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, attempts - 1);
      }
      throw error;
    }
  }

  // Process response with comprehensive error handling
  async processResponse(response, endpoint) {
    try {
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        return APIResponse.success(data, response.status);
      }

      // Handle different error types
      let errorType;
      switch (response.status) {
        case 400:
          errorType = ErrorTypes.VALIDATION_ERROR;
          break;
        case 413:
          errorType = ErrorTypes.VALIDATION_ERROR;
          break;
        case 401:
        case 403:
          errorType = ErrorTypes.AUTH_ERROR;
          break;
        case 404:
          errorType = ErrorTypes.NOT_FOUND;
          break;
        case 500:
        case 502:
        case 503:
          errorType = ErrorTypes.SERVER_ERROR;
          break;
        default:
          errorType = ErrorTypes.SERVER_ERROR;
      }


      const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
      return APIResponse.error(errorMessage, response.status, errorType);
    } catch {
      return APIResponse.error(
        `Failed to parse response from ${endpoint}`, 
        response.status, 
        ErrorTypes.SERVER_ERROR
      );
    }
  }

  // Generic API call method
  async call(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Immediate offline check - fail fast
    if (!navigator.onLine) {
      console.warn(`🔌 Offline: Cannot call ${endpoint}`);
      return APIResponse.error(
        'You are currently offline. Please check your internet connection.',
        null,
        ErrorTypes.NETWORK_ERROR
      );
    }
    
    try {
      console.log(`🔗 API Call: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await this.fetchWithRetry(url, options);
      const result = await this.processResponse(response, endpoint);
      
      if (result.success) {
        console.log(`✅ API Success: ${endpoint}`);
      } else {
        console.warn(`⚠️ API Error: ${endpoint}`, result.error);
      }
      
      return result;
    } catch (error) {
      console.error(`💥 Network Error: ${endpoint}`, error);
      
      let errorType = ErrorTypes.NETWORK_ERROR;
      let errorMessage = 'Network request failed. Please check your connection.';
      
      // Handle different error types with immediate response
      if (error.name === 'OfflineError' || !navigator.onLine) {
        errorMessage = 'You are currently offline. Please check your internet connection.';
      } else if (error.name === 'AbortError') {
        errorType = ErrorTypes.TIMEOUT;
        errorMessage = 'Request timed out. Please try again.';
      }
      
      return APIResponse.error(
        errorMessage,
        null,
        errorType
      );
    }
  }

  // Convenience methods for different HTTP verbs
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    return this.call(url.pathname + url.search);
  }

  async post(endpoint, data = {}) {
    return this.call(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.call(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    return this.call(url.pathname + url.search, {
      method: 'DELETE',
    });
  }

  // File upload method
  async uploadFile(endpoint, file, additionalData = {}, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.call(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type header to let browser set boundary for FormData
      },
      ...options,
    });
  }
}

// Create default API client instance
export const api = new APIClient();

// Specialized API methods for common operations
export const edvantaAPI = {
  // User stats
  getUserStats(userEmail) {
    return api.get('/api/user-stats', { user_email: userEmail });
  },

  // Quizzes
  generateQuiz(topic, difficulty = 'medium', numberOfQuestions = 10) {
    return api.post('/api/quizzes/generate', { topic, difficulty, numberOfQuestions });
  },

  getUserQuizzes(userEmail) {
    return api.get('/api/tools/quizzes', { user_email: userEmail });
  },

  saveQuiz(quizData, userEmail) {
    return api.post('/api/tools/quizzes', { ...quizData, user_email: userEmail });
  },

  deleteQuiz(quizId, userEmail = null) {
    return api.delete(`/api/tools/quizzes/${quizId}`, userEmail ? { user_email: userEmail } : {});
  },

  submitQuiz(quizId, answers) {
    return api.post('/api/quizzes/submit', { quiz_id: quizId, answers });
  },

  getQuizHistory(userEmail) {
    return api.get('/api/quiz-history', { user_email: userEmail });
  },

  logQuizHistory(historyData) {
    return api.post('/api/quiz-history', historyData);
  },

  clearQuizHistory(userEmail) {
    return api.delete('/api/quiz-history', { user_email: userEmail });
  },

  // Roadmaps
  generateRoadmap(goal, background, duration, userEmail) {
    return api.post('/api/roadmap/generate', { goal, background, duration_weeks: duration, user_email: userEmail });
  },

  getUserRoadmaps(userEmail) {
    return api.get('/api/roadmap/user', { user_email: userEmail });
  },

  getRoadmapDetails(roadmapId, userEmail) {
    return api.get(`/api/roadmap/${roadmapId}`, { user_email: userEmail });
  },

  updateRoadmapProgress(roadmapId, progressData, userEmail) {
    return api.put(`/api/roadmap/${roadmapId}?user_email=${encodeURIComponent(userEmail)}`, progressData);
  },

  deleteRoadmap(roadmapId, userEmail) {
    return api.delete(`/api/roadmap/${roadmapId}?user_email=${encodeURIComponent(userEmail)}`);
  },

  downloadRoadmap(roadmapId, userEmail) {
    return api.get(`/api/roadmap/download/${roadmapId}`, { user_email: userEmail });
  },

  // Chatbot
  sendChatMessage(message, userEmail, conversationId = null) {
    return api.post('/api/chat/message', { input: message, user_email: userEmail, session_id: conversationId });
  },

  loadChatHistory(userEmail) {
    return api.get('/api/chat/loadChat', { user_email: userEmail });
  },

  // Tutor
  startTutorSession(mode, userEmail, subject = 'general', isVoiceInput = false) {
    return api.post('/api/tutor/session/start', { mode, subject, user_email: userEmail, isVoiceInput });
  },

  // Resume Analysis
  analyzeResume(file, userEmail = null) {
    const additionalData = userEmail ? { user_email: userEmail } : {};
    return api.uploadFile('/api/resume/analyze', file, additionalData, { timeout: 120000 });
  },

  getResumeHistory(userEmail) {
    return api.get('/api/resume/history', { user_email: userEmail });
  },

  deleteResume(id, userEmail = null) {
    return api.delete(`/api/resume/history/${id}`, userEmail ? { user_email: userEmail } : {});
  },

  // Videos (YouTube search proxy)
  searchVideos(query, maxResults = 12) {
    return api.get('/api/videos/search', { q: query, max_results: maxResults });
  },

  // Health checks
  getHealth() {
    return api.get('/api/health');
  },

  getRuntimeFeatures() {
    return api.get('/api/runtime-features');
  },
};


// Error handling utilities
export const handleAPIError = (error, fallbackMessage = 'Something went wrong') => {
  if (!error) return fallbackMessage;
  
  switch (error.type) {
    case ErrorTypes.NETWORK_ERROR:
      return 'Please check your internet connection and try again.';
    case ErrorTypes.SERVER_ERROR:
      return 'Our servers are experiencing issues. Please try again later.';
    case ErrorTypes.VALIDATION_ERROR:
      return error.message || 'Please check your input and try again.';
    case ErrorTypes.AUTH_ERROR:
      return 'Please log in to access this feature.';
    case ErrorTypes.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorTypes.TIMEOUT:
      return 'The request took too long. Please try again.';
    default:
      return error.message || fallbackMessage;
  }
};

/**
 * Production-ready React hook for executing API calls with loading, error, and data state.
 * @param {Function} apiFn - Async API function returning a promise
 * @returns {{ loading: boolean, error: any, data: any, execute: Function, setError: Function, setData: Function }}
 */
export function useAPICall(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFn(...args);
        if (response && response.success) {
          setData(response.data);
          return response;
        } else {
          const err = response?.error?.message || response?.error || 'API call failed';
          setError(err);
          return response;
        }
      } catch (err) {
        setError(err.message || 'Network request failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn]
  );

  return { loading, error, data, execute, setError, setData };
}

/**
 * Factory function creating a customized API call hook.
 * @param {Function} apiFn
 * @returns {Function} Hook function
 */
export const createAPICallHook = (apiFn) => {
  return () => useAPICall(apiFn);
};

export default edvantaAPI;