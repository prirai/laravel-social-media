/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Make sure Axios sends the CSRF token in the header with every request
window.axios.defaults.withCredentials = true;

// Get CSRF token from meta tag and set as default header for all requests
const getCsrfToken = () => {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : null;
};

// Set initial CSRF token
const initialToken = getCsrfToken();
if (initialToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = initialToken;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Import the clearPrivateKey function for logout handling
import { clearPrivateKey, setupAuthStateListener } from './utils/crypto';

// Setup the auth state listener to automatically clear private keys on logout
setupAuthStateListener();

// Function to refresh CSRF token
const refreshCsrfToken = async () => {
    try {
        const response = await axios.get('/csrf-token');
        if (response.data && response.data.csrf_token) {
            // Update the CSRF token in the meta tag
            const metaToken = document.querySelector('meta[name="csrf-token"]');
            if (metaToken) {
                metaToken.setAttribute('content', response.data.csrf_token);
            }
            
            // Update axios default header
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = response.data.csrf_token;
            
            return response.data.csrf_token;
        }
    } catch (error) {
        // Silent fail in production
    }
    return null;
};

// Add request interceptor to refresh token on every 401/419 response
let isRefreshing = false;
let refreshSubscribers = [];

// Push failed requests to be retried after token refresh
const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

// Notify subscribers that token is refreshed
const onTokenRefreshed = (token) => {
    refreshSubscribers.map(cb => cb(token));
    refreshSubscribers = [];
};

// Add request interceptor to include updated CSRF token
window.axios.interceptors.request.use(config => {
    // Get the latest token from meta tag (in case it was updated)
    const latestToken = getCsrfToken();
    if (latestToken) {
        config.headers['X-CSRF-TOKEN'] = latestToken;
    }
    return config;
});

// Add response interceptor to handle session expiration
window.axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        // Handle session expiration (419) or unauthorized (401) responses
        if (error.response) {
            // Check for CSRF token mismatch (419) or Unauthorized (401)
            if ((error.response.status === 419 || error.response.status === 401) && !originalRequest._retry) {
                if (isRefreshing) {
                    // If already refreshing, queue this request to retry later
                    return new Promise(resolve => {
                        subscribeTokenRefresh(token => {
                            originalRequest.headers['X-CSRF-TOKEN'] = token;
                            resolve(axios(originalRequest));
                        });
                    });
                }
                
                originalRequest._retry = true;
                isRefreshing = true;
                
                try {
                    // Try to refresh the CSRF token
                    const newToken = await refreshCsrfToken();
                    
                    if (newToken) {
                        // Update the token in the failed request
                        originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                        
                        // Notify subscribers that the token is refreshed
                        onTokenRefreshed(newToken);
                        
                        // Retry the original request with the new token
                        return axios(originalRequest);
                    }
                } catch (refreshError) {
                    // Clean up encryption state
                    clearPrivateKey();
                    
                    // Redirect to login page if not already there
                    const isLoginPage = window.location.pathname === '/login';
                    if (!isLoginPage) {
                        window.location.href = '/login?expired=1';
                    }
                } finally {
                    isRefreshing = false;
                }
            }
        }
        
        // If we reach here, either token refresh failed or it's another type of error
        return Promise.reject(error);
    }
);

// Monitor for form submissions to the logout endpoint
document.addEventListener('submit', (event) => {
    const form = event.target;
    
    // Check if this is a logout form submission
    if (form instanceof HTMLFormElement) {
        const actionUrl = new URL(form.action, window.location.origin).pathname;
        
        // Check if the form action is the logout route
        if (actionUrl === '/logout') {
            // Clean up encryption state when logging out
            clearPrivateKey();
        }
    }
}); 