import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="p-3 md:p-5">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    <div className="p-4 md:p-6">
                        {children}
                    </div>
                </div>
            </AppContent>
        </AppShell>
    );
}
