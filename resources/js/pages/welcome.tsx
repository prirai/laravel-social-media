import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Sun, Moon, Computer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [systemPrefersDark, setSystemPrefersDark] = useState(false);

    useEffect(() => {
        const localTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setSystemPrefersDark(prefersDark);
        
        if (localTheme) {
            setTheme(localTheme);
        } else {
            if (prefersDark) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        }

        // Setup listener for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemPrefersDark(e.matches);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            }
        }
    }, [theme]);

    const toggleTheme = () => {
        if (theme === 'dark') {
            setTheme('light');
        } else if (theme === 'light') {
            setTheme('system');
        } else {
            setTheme('dark');
        }
    };

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700&display=swap" rel="stylesheet" />
            </Head>
            <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
                {/* Header/Navbar */}
                <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md py-4 dark:border-gray-800 dark:bg-gray-950/80">
                    <nav className="container mx-auto flex items-center justify-between px-4 md:px-6">
                        <Link href="/" className="flex items-center text-2xl font-semibold">
                            <span className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                                SimpleSocial
                            </span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-lg"
                                onClick={toggleTheme}
                            >
                                <div className="relative h-5 w-5">
                                    <Sun className={`h-5 w-5 transition-all ${theme === 'light' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`} />
                                    <Moon className={`absolute inset-0 h-5 w-5 transition-all ${theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} />
                                    <Computer className={`absolute inset-0 h-5 w-5 transition-all ${theme === 'system' ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} />
                                </div>
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                            
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Main Content */}
                <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-12 px-4 py-12 md:px-6 lg:flex-row lg:py-24 relative">
                    <div className="absolute inset-0 -z-10">
                        <PlaceholderPattern className="size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                    </div>
                    
                    {/* Image (Moved before text on larger screens) */}
                    <div className="w-full max-w-lg lg:w-1/2">
                        <div className="relative">
                            <div className="absolute -z-10 h-full w-full rounded-3xl bg-gradient-to-br from-blue-100/80 to-indigo-100/80 blur-xl dark:from-blue-900/30 dark:to-indigo-900/30"></div>
                            <img
                                src="/img/ssopt_v1.svg"
                                alt="SimpleSocial Welcome Image"
                                className="relative z-10 w-full rounded-2xl object-cover shadow-xl"
                            />
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="w-full max-w-lg space-y-6 text-center lg:w-1/2 lg:text-left">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">Connect and Share</h1>
                        <p className="text-lg leading-relaxed text-gray-600 sm:text-xl dark:text-gray-300">
                            SimpleSocial is a place to connect with friends, family, and people you know. Share your thoughts, photos, and more.
                        </p>
                        <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-medium text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 sm:w-auto dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="w-full rounded-lg border border-gray-300 bg-white/80 px-6 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:w-auto dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200 dark:hover:bg-gray-800/70" 
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-medium text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 sm:w-auto dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-md py-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950/80 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} SimpleSocial. All rights reserved.
                </footer>
            </div>
        </>
    );
}
