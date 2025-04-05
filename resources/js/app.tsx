import './bootstrap.js';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { NotificationProvider } from './contexts/NotificationContext';
import { initializeTheme } from './hooks/use-appearance';
import axios from 'axios';

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Laravel';

// Configure global axios settings
axios.defaults.withCredentials = true;

// Add a response interceptor for handling errors globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle auth page calls differently
        const isAuthPage = document.body.classList.contains('auth-page');
        
        // Only show errors in console in development mode
        if (process.env.NODE_ENV === 'development' && !isAuthPage) {
            console.error('API Error:', error);
        }
        
        // Don't redirect to login on auth pages
        if (error.response && error.response.status === 401 && !isAuthPage) {
            // User is not authenticated, you could handle redirect here if needed
        }
        
        return Promise.reject(error);
    }
);

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
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

// This will set light / dark mode on load...
initializeTheme();
