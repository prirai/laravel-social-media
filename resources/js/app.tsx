import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { NotificationProvider } from './contexts/NotificationContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
