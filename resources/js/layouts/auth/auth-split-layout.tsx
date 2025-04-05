import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren, useEffect } from 'react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    // Add auth-page class to body when component mounts
    useEffect(() => {
        // Add class to signal this is an auth page
        document.body.classList.add('auth-page');
        
        // Cleanup on unmount
        return () => {
            document.body.classList.remove('auth-page');
        };
    }, []);

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left side with gradient background and quote - visible on lg screens */}
            <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r border-gray-800">
                {/* Gradient background with subtle pattern overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900 dark:from-blue-900 dark:to-indigo-950 opacity-90" />
                
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                    <PlaceholderPattern className="size-full stroke-white" />
                </div>
                
                {/* Logo and app name */}
                <Link href={route('home')} className="relative z-20 flex items-center text-xl font-medium">
                    <AppLogoIcon className="mr-2 size-8 fill-current text-white" />
                    <span className="bg-gradient-to-r from-blue-200 to-indigo-100 bg-clip-text text-transparent">
                        {name}
                    </span>
                </Link>
                
                {/* Quote section */}
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                            <blockquote className="space-y-2">
                                <p className="text-lg font-light italic text-white">&ldquo;{quote.message}&rdquo;</p>
                                <footer className="text-sm font-medium text-blue-100">{quote.author}</footer>
                            </blockquote>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Right side with form content */}
            <div className="relative flex w-full items-center justify-center bg-white dark:bg-gray-950 lg:p-8">
                {/* Background pattern for visual interest */}
                <div className="absolute inset-0 overflow-hidden">
                    <PlaceholderPattern className="size-full stroke-gray-200 dark:stroke-gray-800 opacity-50" />
                </div>
                
                {/* Card container for auth forms */}
                <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-xl backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90 sm:p-8 lg:p-10">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6">
                        {/* Mobile logo (hidden on lg screens) */}
                        <Link href={route('home')} className="relative z-20 flex items-center justify-center lg:hidden">
                            <AppLogoIcon className="h-10 fill-current text-blue-600 dark:text-blue-400 sm:h-12" />
                        </Link>
                        
                        {/* Title and description */}
                        <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                            <h1 className={cn(
                                "text-2xl font-bold tracking-tight sm:text-3xl",
                                "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
                                "dark:from-blue-400 dark:to-indigo-400"
                            )}>
                                {title}
                            </h1>
                            <p className="text-sm text-balance text-gray-600 dark:text-gray-300">
                                {description}
                            </p>
                        </div>
                        
                        {/* Children content (auth forms) */}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
