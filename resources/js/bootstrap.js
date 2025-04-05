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

// Import the handleLogoutEncryptionCleanup function for logout handling
import { handleLogoutEncryptionCleanup } from './utils/crypto';

// Add request interceptor to handle session expiration
window.axios.interceptors.response.use(
    response => response,
    error => {
        // Handle session expiration (419) or unauthorized (401) responses
        if (error.response) {
            if (error.response.status === 419) {
                // If we receive a 419 (CSRF token mismatch/session expired), clean up encryption state
                handleLogoutEncryptionCleanup();
                // Then refresh the page to get a new token
                window.location.reload();
            } else if (error.response.status === 401) {
                // If we receive a 401 (Unauthorized), the session likely expired
                // Clean up encryption state before redirect
                handleLogoutEncryptionCleanup();
                
                // If the app redirects to login, let it happen naturally
                // If not, we could force a redirect here
                // window.location.href = '/login';
            }
        }
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
            handleLogoutEncryptionCleanup();
        }
    }
}); 