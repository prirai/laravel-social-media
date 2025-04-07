import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Group React and related packages
                    'vendor-react': ['react', 'react-dom', '@inertiajs/react'],
                    
                    // Group UI components
                    'vendor-ui': [
                        '@headlessui/react',
                        '@heroicons/react',
                        'lucide-react',
                        '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-label',
                        '@radix-ui/react-slot',
                    ],
                    
                    // Group utilities
                    'vendor-utils': ['axios', 'clsx', 'class-variance-authority', 'tailwind-merge'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
});
