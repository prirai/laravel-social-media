import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { NotificationProvider } from './contexts/NotificationContext';

// Add Inertia error handling
import { router } from '@inertiajs/react';
import { handleLogoutEncryptionCleanup } from './utils/crypto';

// Handle 419 errors globally with Inertia router
router.on('error', (e) => {
    // Convert the event to any type to access the response property
    const error = e as any;
    
    // Check if this is a 419 error (CSRF token mismatch)
    if (error.response && error.response.status === 419) {
        // Clean up encryption state
        handleLogoutEncryptionCleanup();
        
        // Redirect to login with message instead of showing an error
        window.location.href = '/login?expired=1';
        
        // Prevent default error handling
        return false;
    }
    
    // For all other errors, allow Inertia to handle them normally
    return true;
});

// Add global Inertia interceptor to ensure CSRF token is included in all requests
router.on('before', (event) => {
    const visit = event as any; // Cast to any to access properties
    
    // If the request method is POST, PUT, PATCH, or DELETE, add the CSRF token
    if (visit.method && ['post', 'put', 'patch', 'delete'].includes(visit.method.toLowerCase()) && visit.data) {
        // Get CSRF token from meta tag
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Add token to data if it doesn't already have it
        if (token && visit.data && typeof visit.data === 'object' && !('_token' in visit.data)) {
            visit.data._token = token;
        }
    }
});

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        // Implement code splitting for large components
        if (name.startsWith('pages/messaging')) {
            return import(`./pages/messaging`);
        }
        if (name.startsWith('pages/dashboard')) {
            return import(`./pages/dashboard`);
        }
        if (name.startsWith('pages/marketplace')) {
            return import(`./pages/marketplace`);
        }
        
        // Default resolver for other components
        return resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx')
        );
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <NotificationProvider>
                <App {...props} />
            </NotificationProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
