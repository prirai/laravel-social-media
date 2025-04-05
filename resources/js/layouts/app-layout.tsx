import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { useEffect } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    fullWidth?: boolean;
}

export default ({ children, breadcrumbs, fullWidth, ...props }: AppLayoutProps) => {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(() => {
                        console.log('ServiceWorker registration successful');
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    }, []);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <main className={`mx-auto flex h-full w-full flex-1 flex-col gap-4 rounded-xl ${fullWidth ? '' : 'max-w-7xl'}`}>
                {children}
            </main>
        </AppLayoutTemplate>
    );
};
